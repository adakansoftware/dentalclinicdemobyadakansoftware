"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const serviceSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  nameTr: z.string().min(2, "Türkçe ad gerekli"),
  nameEn: z.string().min(2, "İngilizce ad gerekli"),
  shortDescTr: z.string().min(5, "Türkçe kısa açıklama gerekli"),
  shortDescEn: z.string().min(5, "İngilizce kısa açıklama gerekli"),
  descriptionTr: z.string().min(10, "Türkçe açıklama gerekli"),
  descriptionEn: z.string().min(10, "İngilizce açıklama gerekli"),
  iconName: z.string().default("tooth"),
  durationMinutes: z.coerce.number().min(15).max(480),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

export async function createServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse({
    slug: formData.get("slug"),
    nameTr: formData.get("nameTr"),
    nameEn: formData.get("nameEn"),
    shortDescTr: formData.get("shortDescTr"),
    shortDescEn: formData.get("shortDescEn"),
    descriptionTr: formData.get("descriptionTr"),
    descriptionEn: formData.get("descriptionEn"),
    iconName: formData.get("iconName") ?? "tooth",
    durationMinutes: formData.get("durationMinutes"),
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  const exists = await prisma.service.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { success: false, error: "Bu slug zaten kullanımda" };
  await prisma.service.create({ data: parsed.data });
  revalidatePath("/admin/services");
  return { success: true };
}

export async function updateServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  const parsed = serviceSchema.safeParse({
    slug: formData.get("slug"),
    nameTr: formData.get("nameTr"),
    nameEn: formData.get("nameEn"),
    shortDescTr: formData.get("shortDescTr"),
    shortDescEn: formData.get("shortDescEn"),
    descriptionTr: formData.get("descriptionTr"),
    descriptionEn: formData.get("descriptionEn"),
    iconName: formData.get("iconName") ?? "tooth",
    durationMinutes: formData.get("durationMinutes"),
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  const conflict = await prisma.service.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (conflict) return { success: false, error: "Bu slug zaten kullanımda" };
  await prisma.service.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/services");
  return { success: true };
}

export async function deleteServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  return { success: true };
}
