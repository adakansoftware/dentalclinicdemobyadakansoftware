"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const reviewSchema = z.object({
  patientName: z.string().min(2, "Ad gerekli"),
  ratingStars: z.coerce.number().min(1).max(5),
  contentTr: z.string().min(10, "Yorum gerekli"),
  contentEn: z.string().optional(),
});

export async function submitReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
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
      contentEn: parsed.data.contentEn ?? parsed.data.contentTr,
      isApproved: false,
      isVisible: true,
    },
  });
  return { success: true };
}

export async function approveReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.review.update({ where: { id }, data: { isApproved: true } });
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function deleteReviewAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  return { success: true };
}
