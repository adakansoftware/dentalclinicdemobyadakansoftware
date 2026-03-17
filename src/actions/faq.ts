"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const faqSchema = z.object({
  questionTr: z.string().min(5, "Türkçe soru gerekli"),
  questionEn: z.string().min(5, "İngilizce soru gerekli"),
  answerTr: z.string().min(10, "Türkçe cevap gerekli"),
  answerEn: z.string().min(10, "İngilizce cevap gerekli"),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
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
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  const parsed = faqSchema.safeParse({
    questionTr: formData.get("questionTr"), questionEn: formData.get("questionEn"),
    answerTr: formData.get("answerTr"), answerEn: formData.get("answerEn"),
    order: formData.get("order") ?? "0", isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  await prisma.fAQItem.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/faq");
  return { success: true };
}

export async function deleteFAQAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.fAQItem.delete({ where: { id } });
  revalidatePath("/admin/faq");
  return { success: true };
}
