"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordIdSchema, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/input";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { enforceRateLimit, validateFormAge, validateHoneypot } from "@/lib/security";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const reviewSchema = z.object({
  patientName: z.string().trim().min(2, "Ad gerekli").max(120).transform(sanitizeTextInput),
  ratingStars: z.coerce.number().min(1).max(5),
  contentTr: z.string().trim().min(10, "Yorum gerekli").max(1500).transform(sanitizeTextareaInput),
  contentEn: z.string().trim().transform(sanitizeTextareaInput).optional(),
});

const reviewIdSchema = z.object({
  id: recordIdSchema,
});

export async function submitReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: "İstek doğrulanamadı. Lütfen tekrar deneyin." };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin." };
  }

  const allowed = await enforceRateLimit({
    scope: "review-submit",
    limit: 4,
    windowMs: 30 * 60 * 1000,
  });

  if (!allowed) {
    return { success: false, error: "Çok fazla yorum gönderildi. Lütfen daha sonra tekrar deneyin." };
  }

  const parsed = reviewSchema.safeParse({
    patientName: formData.get("patientName"),
    ratingStars: formData.get("ratingStars"),
    contentTr: formData.get("contentTr"),
    contentEn: formData.get("contentEn") || formData.get("contentTr"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };

  await prisma.review.create({
    data: {
      patientName: parsed.data.patientName,
      ratingStars: parsed.data.ratingStars,
      contentTr: parsed.data.contentTr,
      contentEn: parsed.data.contentEn || parsed.data.contentTr,
      isApproved: false,
      isVisible: true,
    },
  });

  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function approveReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reviewIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  await prisma.review.update({ where: { id: parsed.data.id }, data: { isApproved: true } });
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { success: true };
}

export async function deleteReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reviewIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  await prisma.review.delete({ where: { id: parsed.data.id } });
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { success: true };
}
