"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  cancelAppointmentByPhoneRecord,
  createAppointmentRecord,
  lookupAppointmentsByPhoneRecord,
  updateAppointmentStatusRecord,
} from "@/lib/appointment-service";
import { isBackendError } from "@/lib/backend-errors";
import { getTodayDateInTurkey, compareDateStrings, dateToIsoDate } from "@/lib/date";
import { logEvent } from "@/lib/observability";
import { runPublicActionGuard } from "@/lib/public-action-guard";
import { enforceRateLimit } from "@/lib/security";
import { getSiteSettings } from "@/lib/settings";
import { getAvailableSlots } from "@/lib/slots";
import { buildCancellationMessage, buildConfirmationMessage, sendSms } from "@/lib/sms";
import { revalidatePath } from "next/cache";
import type { ActionResult, PublicAppointmentLookupItem, TimeSlot } from "@/types";

const createAppointmentSchema = z
  .object({
    serviceId: z.string().min(1, "Hizmet secimi gerekli"),
    specialistId: z.string().min(1, "Uzman secimi gerekli"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Gecerli tarih girin"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Gecerli saat girin"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Gecerli bitis saati girin"),
    patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmali").max(120),
    patientPhone: z.string().trim().min(10, "Gecerli telefon numarasi girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
    patientEmail: z.string().trim().email().or(z.literal("")),
    patientNote: z.string().trim().max(500).optional(),
    patientLanguage: z.enum(["TR", "EN"]).default("TR"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Bitis saati baslangic saatinden sonra olmali",
    path: ["endTime"],
  });

export async function createAppointmentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const guardResult = await runPublicActionGuard({
    formData,
    rateLimit: {
      scope: "appointment-create",
      limit: 6,
      windowMs: 15 * 60 * 1000,
      keySuffix: [
        String(formData.get("patientPhone") ?? ""),
        String(formData.get("date") ?? ""),
        String(formData.get("startTime") ?? ""),
      ].join(":"),
    },
    validationErrorMessage: "Istek dogrulanamadi. Lutfen formu tekrar gonderin.",
  });

  if (guardResult) {
    return guardResult;
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
      error: patientLanguage === "EN" ? "Please choose a future date." : "Lutfen ileri bir tarih secin.",
    };
  }

  try {
    const appointment = await createAppointmentRecord({
      serviceId,
      specialistId,
      date,
      startTime,
      endTime,
      patientName: parsed.data.patientName,
      patientPhone: parsed.data.patientPhone,
      patientEmail: parsed.data.patientEmail ?? "",
      patientNote: parsed.data.patientNote ?? "",
      patientLanguage: parsed.data.patientLanguage,
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
    if (isBackendError(error, "SLOT_UNAVAILABLE")) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "This time slot is no longer available. Please choose another time."
            : "Bu zaman dilimi artik uygun degil. Lutfen baska bir saat secin.",
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

export async function updateAppointmentStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  try {
    const { previousAppointment, updatedAppointment } = await updateAppointmentStatusRecord({
      id: parsed.data.id,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? "",
    });

    if (updatedAppointment.status === "CANCELLED" && previousAppointment.status !== "CANCELLED") {
      void (async () => {
        try {
          const settings = await getSiteSettings();
          const dateStr = dateToIsoDate(previousAppointment.date);
          const message = buildCancellationMessage(
            previousAppointment.patientLanguage,
            previousAppointment.patientName,
            dateStr,
            previousAppointment.startTime,
            settings.clinicName,
            settings.phone
          );
          await sendSms({
            phone: previousAppointment.patientPhone,
            message,
            appointmentId: previousAppointment.id,
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
        previousStatus: previousAppointment.status,
        nextStatus: updatedAppointment.status,
      },
    });

    revalidatePath("/admin/appointments");
    return { success: true };
  } catch (error) {
    if (isBackendError(error, "APPOINTMENT_NOT_FOUND")) {
      return { success: false, error: "Randevu bulunamadi" };
    }

    if (isBackendError(error, "APPOINTMENT_STATUS_CONFLICT")) {
      return {
        success: false,
        error:
          parsed.data.status === "PENDING" || parsed.data.status === "CONFIRMED"
            ? "Bu uzman icin ayni tarih ve saatte baska aktif bir randevu zaten bulunuyor."
            : "Bu randevu durumu icin secilen gecis desteklenmiyor.",
      };
    }

    throw error;
  }
}

export async function getAvailableSlotsAction(specialistId: string, date: string): Promise<TimeSlot[]> {
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
  patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmali").max(120),
  patientPhone: z.string().trim().min(10, "Gecerli telefon numarasi girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Gecerli tarih girin"),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export async function cancelAppointmentByPhoneAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult<{ cancelledId: string }>> {
  const guardResult = await runPublicActionGuard<{ cancelledId: string }>({
    formData,
    rateLimit: {
      scope: "appointment-cancel",
      limit: 4,
      windowMs: 15 * 60 * 1000,
      keySuffix: [String(formData.get("patientPhone") ?? ""), String(formData.get("date") ?? "")].join(":"),
    },
    validationErrorMessage: "Istek dogrulanamadi. Lutfen formu tekrar gonderin.",
    rateLimitErrorMessage: "Cok fazla iptal denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
  });

  if (guardResult) {
    return guardResult;
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
      error: patientLanguage === "EN" ? "Please enter today or a future date." : "Lutfen bugun veya ileri bir tarih girin.",
    };
  }

  try {
    const appointment = await cancelAppointmentByPhoneRecord({
      patientName,
      patientPhone,
      date,
    });

    if (!appointment) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "No active appointment was found for this phone number on the selected date."
            : "Secilen tarihte bu telefon numarasina ait aktif bir randevu bulunamadi.",
      };
    }

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
    if (isBackendError(error, "APPOINTMENT_CANCEL_CONFLICT")) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "Multiple appointments were found for that phone number on the selected date. Please contact the clinic."
            : "Secilen tarihte bu numaraya ait birden fazla randevu bulundu. Lutfen klinikle iletisime gecin.",
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
  patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmali").max(120),
  patientPhone: z.string().trim().min(10, "Gecerli telefon numarasi girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export async function lookupAppointmentsByPhoneAction(
  _prev: ActionResult<PublicAppointmentLookupItem[]>,
  formData: FormData
): Promise<ActionResult<PublicAppointmentLookupItem[]>> {
  const guardResult = await runPublicActionGuard<PublicAppointmentLookupItem[]>({
    formData,
    rateLimit: {
      scope: "appointment-lookup",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      keySuffix: String(formData.get("patientPhone") ?? ""),
    },
    validationErrorMessage: "Istek dogrulanamadi. Lutfen formu tekrar gonderin.",
    rateLimitErrorMessage: "Cok fazla sorgu yapildi. Lutfen biraz sonra tekrar deneyin.",
  });

  if (guardResult) {
    return guardResult;
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
  const today = getTodayDateInTurkey();

  try {
    const matches = await lookupAppointmentsByPhoneRecord({
      patientName,
      patientPhone,
      patientLanguage,
      fromDate: today,
    });

    if (matches.length === 0) {
      return {
        success: false,
        error:
          patientLanguage === "EN"
            ? "No upcoming appointments were found for this phone number."
            : "Bu telefon numarasina ait yaklasan bir randevu bulunamadi.",
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
