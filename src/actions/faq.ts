"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAdminMutation } from "@/lib/admin-mutation";
import { recordIdSchema, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/input";
import type { ActionResult } from "@/types";

const faqSchema = z.object({
  questionTr: z.string().trim().min(5, "Turkce soru gerekli").transform(sanitizeTextInput),
  questionEn: z.string().trim().min(5, "Ingilizce soru gerekli").transform(sanitizeTextInput),
  answerTr: z.string().trim().min(10, "Turkce cevap gerekli").transform(sanitizeTextareaInput),
  answerEn: z.string().trim().min(10, "Ingilizce cevap gerekli").transform(sanitizeTextareaInput),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

const faqIdSchema = z.object({
  id: recordIdSchema,
});

export async function createFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = faqSchema.safeParse({
    questionTr: formData.get("questionTr"),
    questionEn: formData.get("questionEn"),
    answerTr: formData.get("answerTr"),
    answerEn: formData.get("answerEn"),
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  return runAdminMutation({
    route: "action:createFAQ",
    event: "faq_created",
    execute: async () => {
      await prisma.fAQItem.create({ data: parsed.data });
      return {
        meta: {
          order: parsed.data.order,
          isActive: parsed.data.isActive,
        },
        revalidate: ["/admin/faq"],
      };
    },
  });
}

export async function updateFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const idParsed = faqIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.errors[0]?.message ?? "ID gerekli" };
  }

  const parsed = faqSchema.safeParse({
    questionTr: formData.get("questionTr"),
    questionEn: formData.get("questionEn"),
    answerTr: formData.get("answerTr"),
    answerEn: formData.get("answerEn"),
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  return runAdminMutation({
    route: "action:updateFAQ",
    event: "faq_updated",
    execute: async () => {
      await prisma.fAQItem.update({
        where: { id: idParsed.data.id },
        data: parsed.data,
      });

      return {
        meta: {
          faqId: idParsed.data.id,
          order: parsed.data.order,
          isActive: parsed.data.isActive,
        },
        revalidate: ["/admin/faq"],
      };
    },
    getErrorMessage: () => "FAQ guncellenemedi",
  });
}

export async function deleteFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = faqIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  }

  return runAdminMutation({
    route: "action:deleteFAQ",
    event: "faq_deleted",
    execute: async () => {
      await prisma.fAQItem.delete({ where: { id: parsed.data.id } });
      return {
        meta: {
          faqId: parsed.data.id,
        },
        revalidate: ["/admin/faq"],
      };
    },
    getErrorMessage: () => "FAQ silinemedi",
  });
}
