"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { dateOnlyToDbDate } from "@/lib/date";
import { recordIdSchema, sanitizeTextareaInput } from "@/lib/input";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const workingHourSchema = z
  .object({
    specialistId: recordIdSchema,
    dayOfWeek: z.coerce.number().min(0).max(6),
    startTime: timeSchema,
    endTime: timeSchema,
    slotMinutes: z.coerce.number().min(15).max(120),
    isOpen: z.string().transform((v) => v === "true"),
  })
  .refine((data) => !data.isOpen || data.startTime < data.endTime, {
    message: "Bitiş saati başlangıçtan sonra olmalı",
    path: ["endTime"],
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

const blockedSlotSchema = z
  .object({
    specialistId: recordIdSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: timeSchema,
    endTime: timeSchema,
    reason: z.string().trim().max(200).transform(sanitizeTextareaInput).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Bitiş saati başlangıçtan sonra olmalı",
    path: ["endTime"],
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
      date: dateOnlyToDbDate(parsed.data.date),
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
  const parsed = z.object({ id: recordIdSchema }).safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  await prisma.blockedSlot.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/blocked-slots");
  return { success: true };
}
