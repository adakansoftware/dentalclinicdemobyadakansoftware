"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAdminMutation } from "@/lib/admin-mutation";
import { dateOnlyToDbDate } from "@/lib/date";
import { recordIdSchema, sanitizeTextareaInput } from "@/lib/input";
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
    message: "Bitis saati baslangictan sonra olmali",
    path: ["endTime"],
  });

export async function upsertWorkingHourAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = workingHourSchema.safeParse({
    specialistId: formData.get("specialistId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes") ?? "30",
    isOpen: formData.get("isOpen") ?? "false",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const { specialistId, dayOfWeek, ...rest } = parsed.data;

  return runAdminMutation({
    route: "action:upsertWorkingHour",
    event: "working_hour_upserted",
    execute: async () => {
      await prisma.workingHour.upsert({
        where: { specialistId_dayOfWeek: { specialistId, dayOfWeek } },
        update: rest,
        create: { specialistId, dayOfWeek, ...rest },
      });

      return {
        meta: {
          specialistId,
          dayOfWeek,
          isOpen: rest.isOpen,
        },
        revalidate: ["/admin/working-hours"],
      };
    },
    getErrorMessage: () => "Calisma saati kaydedilemedi",
  });
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
    message: "Bitis saati baslangictan sonra olmali",
    path: ["endTime"],
  });

export async function createBlockedSlotAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = blockedSlotSchema.safeParse({
    specialistId: formData.get("specialistId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  return runAdminMutation({
    route: "action:createBlockedSlot",
    event: "blocked_slot_created",
    execute: async () => {
      await prisma.blockedSlot.create({
        data: {
          specialistId: parsed.data.specialistId,
          date: dateOnlyToDbDate(parsed.data.date),
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          reason: parsed.data.reason ?? "",
        },
      });

      return {
        meta: {
          specialistId: parsed.data.specialistId,
          date: parsed.data.date,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
        },
        revalidate: ["/admin/blocked-slots"],
      };
    },
    getErrorMessage: () => "Bloke saat olusturulamadi",
  });
}

export async function deleteBlockedSlotAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id: recordIdSchema }).safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  }

  return runAdminMutation({
    route: "action:deleteBlockedSlot",
    event: "blocked_slot_deleted",
    execute: async () => {
      await prisma.blockedSlot.delete({ where: { id: parsed.data.id } });
      return {
        meta: {
          blockedSlotId: parsed.data.id,
        },
        revalidate: ["/admin/blocked-slots"],
      };
    },
    getErrorMessage: () => "Bloke saat silinemedi",
  });
}
