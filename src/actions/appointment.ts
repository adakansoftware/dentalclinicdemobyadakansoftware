"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hasConflictingActiveAppointment } from "@/lib/appointment-conflicts";
import { canTransitionAppointmentStatus } from "@/lib/appointment-state";
import { checkSlotAvailabilityWithDb, getAvailableSlots } from "@/lib/slots";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { getSiteSettings } from "@/lib/settings";
import { sendSms, buildConfirmationMessage, buildCancellationMessage } from "@/lib/sms";
import { dateOnlyToDbDate, dateToIsoDate, getTodayDateInTurkey, compareDateStrings, getUtcRangeForTurkeyDate } from "@/lib/date";
import { enforceRateLimit, validateFormAge, validateHoneypot } from "@/lib/security";
import { logEvent } from "@/lib/observability";
import { revalidatePath } from "next/cache";
import type { ActionResult, TimeSlot } from "@/types";

const SLOT_UNAVAILABLE_ERROR = "SLOT_UNAVAILABLE_ERROR";
const APPOINTMENT_CANCEL_CONFLICT = "APPOINTMENT_CANCEL_CONFLICT";
const APPOINTMENT_STATUS_CONFLICT = "APPOINTMENT_STATUS_CONFLICT";

function normalizePhoneForComparison(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeNameForComparison(name: string) {
  return name
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getAppointmentIdsByNormalizedPhone(params: {
  normalizedPhone: string;
  startUtc: Date;
  endUtc?: Date;
  activeOnly?: boolean;
  limit: number;
}) {
  const rows = params.activeOnly && params.endUtc
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "Appointment"
        WHERE "date" >= ${params.startUtc}
          AND "date" <= ${params.endUtc}
          AND "status" IN ('PENDING', 'CONFIRMED')
          AND regexp_replace("patientPhone", '\D', '', 'g') = ${params.normalizedPhone}
        ORDER BY "date" ASC, "startTime" ASC
        LIMIT ${params.limit}
      `
    : await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "Appointment"
        WHERE "date" >= ${params.startUtc}
          AND regexp_replace("patientPhone", '\D', '', 'g') = ${params.normalizedPhone}
        ORDER BY "date" ASC, "startTime" ASC
        LIMIT ${params.limit}
      `;

  return rows.map((row) => row.id);
}

interface PublicAppointmentLookupItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  serviceName: string;
  specialistName: string;
}

const createAppointmentSchema = z
  .object({
    serviceId: z.string().min(1, "Hizmet seçimi gerekli"),
    specialistId: z.string().min(1, "Uzman seçimi gerekli"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih girin"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli saat girin"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli bitiş saati girin"),
    patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(120),
    patientPhone: z.string().trim().min(10, "Geçerli telefon numarası girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
    patientEmail: z.string().trim().email().or(z.literal("")),
    patientNote: z.string().trim().max(500).optional(),
    patientLanguage: z.enum(["TR", "EN"]).default("TR"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Bitiş saati başlangıç saatinden sonra olmalı",
    path: ["endTime"],
  });

export async function createAppointmentAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: "İstek doğrulanamadı. Lütfen formu tekrar gönderin." };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin." };
  }

  const allowed = await enforceRateLimit({
    scope: "appointment-create",
    limit: 6,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    return { success: false, error: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }

  const parsed = createAppointmentSchema.safeParse({
    serviceId: formData.get("serviceId"),
    specialistId: formData.get("specialistId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    patientName: formData.get("patientName"),
    patientPhone: formData.get("patientPhone"),
    patientEmail: formData.get("patientEmail") ?? "",
    patientNote: formData.get("patientNote") ?? "",
    patientLanguage: formData.get("patientLanguage") ?? "TR",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const { serviceId, specialistId, date, startTime, endTime, patientLanguage } = parsed.data;

  if (compareDateStrings(date, getTodayDateInTurkey()) < 0) {
    return {
      success: false,
      error: patientLanguage === "EN" ? "Please choose a future date." : "Lütfen ileri bir tarih seçin.",
    };
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const lockKey = `appointment:${specialistId}:${date}:${startTime}:${endTime}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const available = await checkSlotAvailabilityWithDb(tx, specialistId, date, startTime, endTime);
      if (!available) {
        throw new Error(SLOT_UNAVAILABLE_ERROR);
      }

      return tx.appointment.create({
        data: {
          serviceId,
          specialistId,
          date: dateOnlyToDbDate(date),
          startTime,
          endTime,
          patientName: parsed.data.patientName,
          patientPhone: parsed.data.patientPhone,
          patientEmail: parsed.data.patientEmail ?? "",
          patientNote: parsed.data.patientNote ?? "",
          patientLanguage: parsed.data.patientLanguage,
          status: "PENDING",
        },
      });
    });

    void (async () => {
      try {
        const settings = await getSiteSettings();
        const message = buildConfirmationMessage(
          parsed.data.patientLanguage,
          parsed.data.patientName,
          date,
          startTime,
          settings.clinicName,
          settings.phone
        );
        await sendSms({
          phone: parsed.data.patientPhone,
          message,
          appointmentId: appointment.id,
          type: "CONFIRMATION",
        });
      } catch {
        // SMS failures should not block the booking flow.
      }
    })();

    logEvent({
      event: "appointment_created",
      route: "action:createAppointment",
      meta: {
        appointmentId: appointment.id,
        serviceId,
        specialistId,
        date,
        startTime,
        language: patientLanguage,
      },
    });

    return { success: true, data: { id: appointment.id } };
  } catch (error) {
    if (error instanceof Error && error.message === SLOT_UNAVAILABLE_ERROR) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "This time slot is no longer available. Please choose another time."
            : "Bu zaman dilimi artık uygun değil. Lütfen başka bir saat seçin.",
      };
    }

    logEvent({
      level: "error",
      event: "appointment_create_failed",
      route: "action:createAppointment",
      message: error instanceof Error ? error.message : "Unknown appointment creation error",
      meta: {
        serviceId,
        specialistId,
        date,
        startTime,
        endTime,
        language: patientLanguage,
      },
    });

    return {
      success: false,
      error: patientLanguage === "EN" ? "An unexpected error occurred." : "Beklenmeyen bir hata olustu.",
    };
  }
}

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  adminNote: z.string().max(1000).optional(),
});

export async function updateAppointmentStatusAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: parsed.data.id },
    include: { service: true, specialist: true },
  });

  if (!appointment) {
    return { success: false, error: "Randevu bulunamadı" };
  }

  if (!canTransitionAppointmentStatus(appointment.status, parsed.data.status)) {
    return {
      success: false,
      error: "Bu randevu durumu için seçilen geçiş desteklenmiyor.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const nextStatus = parsed.data.status;

      if (nextStatus === "PENDING" || nextStatus === "CONFIRMED") {
        const date = dateToIsoDate(appointment.date);
        const lockKey = `appointment:${appointment.specialistId}:${date}:${appointment.startTime}:${appointment.endTime}`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        const hasConflict = await hasConflictingActiveAppointment(tx, {
          specialistId: appointment.specialistId,
          date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          excludeAppointmentId: appointment.id,
        });

        if (hasConflict) {
          throw new Error(APPOINTMENT_STATUS_CONFLICT);
        }
      }

      await tx.appointment.update({
        where: { id: parsed.data.id },
        data: {
          status: parsed.data.status,
          adminNote: parsed.data.adminNote ?? appointment.adminNote,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === APPOINTMENT_STATUS_CONFLICT) {
      return {
        success: false,
        error: "Bu uzman icin ayni tarih ve saatte baska aktif bir randevu zaten bulunuyor.",
      };
    }

    throw error;
  }
  if (parsed.data.status === "CANCELLED" && appointment.status !== "CANCELLED") {
    void (async () => {
      try {
        const settings = await getSiteSettings();
        const dateStr = dateToIsoDate(appointment.date);
        const message = buildCancellationMessage(
          appointment.patientLanguage,
          appointment.patientName,
          dateStr,
          appointment.startTime,
          settings.clinicName,
          settings.phone
        );
        await sendSms({
          phone: appointment.patientPhone,
          message,
          appointmentId: appointment.id,
          type: "CANCELLATION",
        });
      } catch {
        // SMS failures should not block the admin flow.
      }
    })();
  }

  logEvent({
    event: "appointment_status_updated",
    route: "action:updateAppointmentStatus",
    meta: {
      appointmentId: parsed.data.id,
      previousStatus: appointment.status,
      nextStatus: parsed.data.status,
    },
  });

  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function getAvailableSlotsAction(
  specialistId: string,
  date: string
): Promise<TimeSlot[]> {
  const allowed = await enforceRateLimit({
    scope: "slots-action",
    limit: 24,
    windowMs: 60 * 1000,
    keySuffix: `${specialistId}:${date}`,
  });

  if (!allowed) {
    return [];
  }

  return getAvailableSlots(specialistId, date);
}

const cancelAppointmentSchema = z.object({
  patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(120),
  patientPhone: z.string().trim().min(10, "Geçerli telefon numarası girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih girin"),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export async function cancelAppointmentByPhoneAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult<{ cancelledId: string }>> {
  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: "İstek doğrulanamadı. Lütfen formu tekrar gönderin." };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin." };
  }

  const allowed = await enforceRateLimit({
    scope: "appointment-cancel",
    limit: 4,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    return { success: false, error: "Çok fazla iptal denemesi yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }

  const parsed = cancelAppointmentSchema.safeParse({
    patientName: formData.get("patientName"),
    patientPhone: formData.get("patientPhone"),
    date: formData.get("date"),
    patientLanguage: formData.get("patientLanguage") ?? "TR",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const { patientName, patientPhone, date, patientLanguage } = parsed.data;

  if (compareDateStrings(date, getTodayDateInTurkey()) < 0) {
    return {
      success: false,
      error: patientLanguage === "EN" ? "Please enter today or a future date." : "Lütfen bugün veya ileri bir tarih girin.",
    };
  }

  const normalizedPhone = normalizePhoneForComparison(patientPhone);
  const normalizedName = normalizeNameForComparison(patientName);
  const { startUtc, endUtc } = getUtcRangeForTurkeyDate(date);

  try {
    const matchingIds = await getAppointmentIdsByNormalizedPhone({
      normalizedPhone,
      startUtc,
      endUtc,
      activeOnly: true,
      limit: 20,
    });

    const activeAppointments = matchingIds.length
      ? await prisma.appointment.findMany({
          where: {
            id: {
              in: matchingIds,
            },
          },
          orderBy: {
            startTime: "asc",
          },
        })
      : [];

    const matchingAppointments = activeAppointments.filter(
      (appointment) =>
        normalizePhoneForComparison(appointment.patientPhone) === normalizedPhone &&
        normalizeNameForComparison(appointment.patientName) === normalizedName
    );

    if (matchingAppointments.length === 0) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "No active appointment was found for this phone number on the selected date."
            : "Seçilen tarihte bu telefon numarasına ait aktif bir randevu bulunamadı.",
      };
    }

    if (matchingAppointments.length > 1) {
      throw new Error(APPOINTMENT_CANCEL_CONFLICT);
    }

    const appointment = matchingAppointments[0];

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
    });

    void (async () => {
      try {
        const settings = await getSiteSettings();
        const message = buildCancellationMessage(
          appointment.patientLanguage,
          appointment.patientName,
          date,
          appointment.startTime,
          settings.clinicName,
          settings.phone
        );
        await sendSms({
          phone: appointment.patientPhone,
          message,
          appointmentId: appointment.id,
          type: "CANCELLATION",
        });
      } catch {
        // SMS failures should not block public cancellation flow.
      }
    })();

    revalidatePath("/admin/appointments");

    logEvent({
      event: "appointment_cancelled_by_phone",
      route: "action:cancelAppointmentByPhone",
      meta: {
        appointmentId: appointment.id,
        date,
        startTime: appointment.startTime,
        language: patientLanguage,
      },
    });

    return {
      success: true,
      data: { cancelledId: appointment.id },
      message:
        patientLanguage === "EN"
          ? `Your ${appointment.startTime} appointment on ${date} has been cancelled.`
          : `${date} tarihindeki ${appointment.startTime} randevunuz iptal edildi.`,
    };
  } catch (error) {
    if (error instanceof Error && error.message === APPOINTMENT_CANCEL_CONFLICT) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "Multiple appointments were found for that phone number on the selected date. Please contact the clinic."
            : "Seçilen tarihte bu numaraya ait birden fazla randevu bulundu. Lütfen klinikle iletişime geçin.",
      };
    }

    logEvent({
      level: "error",
      event: "appointment_cancel_failed",
      route: "action:cancelAppointmentByPhone",
      message: error instanceof Error ? error.message : "Unknown cancellation error",
      meta: {
        date,
        language: patientLanguage,
      },
    });

    return {
      success: false,
      error: patientLanguage === "EN" ? "An unexpected error occurred." : "Beklenmeyen bir hata olustu.",
    };
  }
}

const lookupAppointmentsSchema = z.object({
  patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(120),
  patientPhone: z.string().trim().min(10, "Geçerli telefon numarası girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export async function lookupAppointmentsByPhoneAction(
  _prev: ActionResult<PublicAppointmentLookupItem[]>,
  formData: FormData
): Promise<ActionResult<PublicAppointmentLookupItem[]>> {
  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: "İstek doğrulanamadı. Lütfen formu tekrar gönderin." };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin." };
  }

  const allowed = await enforceRateLimit({
    scope: "appointment-lookup",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    return { success: false, error: "Çok fazla sorgu yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }

  const parsed = lookupAppointmentsSchema.safeParse({
    patientName: formData.get("patientName"),
    patientPhone: formData.get("patientPhone"),
    patientLanguage: formData.get("patientLanguage") ?? "TR",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const { patientName, patientPhone, patientLanguage } = parsed.data;
  const normalizedPhone = normalizePhoneForComparison(patientPhone);
  const normalizedName = normalizeNameForComparison(patientName);
  const today = getTodayDateInTurkey();
  const { startUtc } = getUtcRangeForTurkeyDate(today);

  try {
    const matchingIds = await getAppointmentIdsByNormalizedPhone({
      normalizedPhone,
      startUtc,
      limit: 50,
    });

    const appointments = matchingIds.length
      ? await prisma.appointment.findMany({
          where: {
            id: {
              in: matchingIds,
            },
          },
          include: {
            service: {
              select: {
                nameTr: true,
                nameEn: true,
              },
            },
            specialist: {
              select: {
                nameTr: true,
                nameEn: true,
              },
            },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        })
      : [];

    const matches = appointments
      .filter(
        (appointment) =>
          normalizePhoneForComparison(appointment.patientPhone) === normalizedPhone &&
          normalizeNameForComparison(appointment.patientName) === normalizedName
      )
      .map((appointment) => ({
        id: appointment.id,
        date: dateToIsoDate(appointment.date),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        serviceName: patientLanguage === "EN" ? appointment.service.nameEn : appointment.service.nameTr,
        specialistName: patientLanguage === "EN" ? appointment.specialist.nameEn : appointment.specialist.nameTr,
      }));

    if (matches.length === 0) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "No upcoming appointments were found for this phone number."
            : "Bu telefon numarasına ait yaklaşan bir randevu bulunamadı.",
      };
    }

    logEvent({
      event: "appointments_lookup_success",
      route: "action:lookupAppointmentsByPhone",
      meta: {
        matchCount: matches.length,
        language: patientLanguage,
      },
    });

    return {
      success: true,
      data: matches,
      message:
        patientLanguage === "EN"
          ? `${matches.length} appointment(s) found.`
          : `${matches.length} adet randevu bulundu.`,
    };
  } catch (error) {
    logEvent({
      level: "error",
      event: "appointments_lookup_failed",
      route: "action:lookupAppointmentsByPhone",
      message: error instanceof Error ? error.message : "Unknown lookup error",
      meta: {
        language: patientLanguage,
      },
    });

    return {
      success: false,
      error: patientLanguage === "EN" ? "An unexpected error occurred." : "Beklenmeyen bir hata olustu.",
    };
  }
}
