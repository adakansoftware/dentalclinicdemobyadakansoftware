"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { checkSlotAvailability, getAvailableSlots } from "@/lib/slots";
import { getSiteSettings } from "@/lib/settings";
import {
  sendSms,
  buildConfirmationMessage,
  buildCancellationMessage,
} from "@/lib/sms";
import { revalidatePath } from "next/cache";
import type { ActionResult, TimeSlot } from "@/types";

const createAppointmentSchema = z.object({
  serviceId: z.string().min(1, "Hizmet seçimi gerekli"),
  specialistId: z.string().min(1, "Uzman seçimi gerekli"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih girin"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli saat girin"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Geçerli bitiş saati girin"),
  patientName: z.string().min(2, "Ad soyad en az 2 karakter olmalı"),
  patientPhone: z
    .string()
    .min(10, "Geçerli telefon numarası girin")
    .regex(/^[\d\s\+\-\(\)]+$/, "Geçerli telefon numarası girin"),
  patientEmail: z.string().email("Geçerli e-posta girin").or(z.literal("")),
  patientNote: z.string().max(500).optional(),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export async function createAppointmentAction(
  _prev: ActionResult<{ id: string }>,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
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

  const { serviceId, specialistId, date, startTime, endTime, patientLanguage } =
    parsed.data;

  const available = await checkSlotAvailability(specialistId, date, startTime, endTime);

  if (!available) {
    return {
      success: false,
      error:
        patientLanguage === "EN"
          ? "This time slot is no longer available. Please choose another time."
          : "Bu zaman dilimi artık uygun değil. Lütfen başka bir saat seçin.",
    };
  }

  const appointment = await prisma.appointment.create({
    data: {
      serviceId,
      specialistId,
      date: new Date(date),
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

  // Send confirmation SMS (fire and forget)
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
    } catch {}
  })();

  return { success: true, data: { id: appointment.id } };
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

  await prisma.appointment.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      adminNote: parsed.data.adminNote ?? appointment.adminNote,
    },
  });

  if (parsed.data.status === "CANCELLED" && appointment.status !== "CANCELLED") {
    void (async () => {
      try {
        const settings = await getSiteSettings();
        const dateStr = appointment.date.toISOString().split("T")[0] ?? "";
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
      } catch {}
    })();
  }

  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function getAvailableSlotsAction(
  specialistId: string,
  date: string
): Promise<TimeSlot[]> {
  return getAvailableSlots(specialistId, date);
}
