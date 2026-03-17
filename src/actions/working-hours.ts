"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const workingHourSchema = z.object({
  specialistId: z.string().min(1),
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMinutes: z.coerce.number().min(15).max(120),
  isOpen: z.string().transform((v) => v === "true"),
});

export async function upsertWorkingHourAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = workingHourSchema.safeParse({
    specialistId: formData.get("specialistId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes") ?? "30",
    isOpen: formData.get("isOpen") ?? "false",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  const { specialistId, dayOfWeek, ...rest } = parsed.data;
  await prisma.workingHour.upsert({
    where: { specialistId_dayOfWeek: { specialistId, dayOfWeek } },
    update: rest,
    create: { specialistId, dayOfWeek, ...rest },
  });
  revalidatePath("/admin/working-hours");
  return { success: true };
}

const blockedSlotSchema = z.object({
  specialistId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(200).optional(),
});

export async function createBlockedSlotAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = blockedSlotSchema.safeParse({
    specialistId: formData.get("specialistId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  await prisma.blockedSlot.create({
    data: {
      specialistId: parsed.data.specialistId,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      reason: parsed.data.reason ?? "",
    },
  });
  revalidatePath("/admin/blocked-slots");
  return { success: true };
}

export async function deleteBlockedSlotAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/blocked-slots");
  return { success: true };
}
