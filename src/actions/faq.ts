"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordIdSchema, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/input";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const faqSchema = z.object({
  questionTr: z.string().trim().min(5, "Türkçe soru gerekli").transform(sanitizeTextInput),
  questionEn: z.string().trim().min(5, "İngilizce soru gerekli").transform(sanitizeTextInput),
  answerTr: z.string().trim().min(10, "Türkçe cevap gerekli").transform(sanitizeTextareaInput),
  answerEn: z.string().trim().min(10, "İngilizce cevap gerekli").transform(sanitizeTextareaInput),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

const faqIdSchema = z.object({
  id: recordIdSchema,
});

export async function createFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = faqSchema.safeParse({
    questionTr: formData.get("questionTr"), questionEn: formData.get("questionEn"),
    answerTr: formData.get("answerTr"), answerEn: formData.get("answerEn"),
    order: formData.get("order") ?? "0", isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  await prisma.fAQItem.create({ data: parsed.data });
  revalidatePath("/admin/faq");
  return { success: true };
}

export async function updateFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const idParsed = faqIdSchema.safeParse({ id: formData.get("id") });
  if (!idParsed.success) return { success: false, error: idParsed.error.errors[0]?.message ?? "ID gerekli" };
  const parsed = faqSchema.safeParse({
    questionTr: formData.get("questionTr"), questionEn: formData.get("questionEn"),
    answerTr: formData.get("answerTr"), answerEn: formData.get("answerEn"),
    order: formData.get("order") ?? "0", isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  await prisma.fAQItem.update({ where: { id: idParsed.data.id }, data: parsed.data });
  revalidatePath("/admin/faq");
  return { success: true };
}

export async function deleteFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = faqIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  await prisma.fAQItem.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/faq");
  return { success: true };
}
