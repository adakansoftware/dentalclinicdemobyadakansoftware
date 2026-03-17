"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const specialistSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameTr: z.string().min(2),
  nameEn: z.string().min(2),
  titleTr: z.string().min(2),
  titleEn: z.string().min(2),
  biographyTr: z.string().min(10),
  biographyEn: z.string().min(10),
  photoUrl: z.string().url().or(z.literal("")).optional(),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

export async function createSpecialistAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = specialistSchema.safeParse({
    slug: formData.get("slug"), nameTr: formData.get("nameTr"), nameEn: formData.get("nameEn"),
    titleTr: formData.get("titleTr"), titleEn: formData.get("titleEn"),
    biographyTr: formData.get("biographyTr"), biographyEn: formData.get("biographyEn"),
    photoUrl: formData.get("photoUrl") ?? "", order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  const exists = await prisma.specialist.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { success: false, error: "Bu slug zaten kullanımda" };
  await prisma.specialist.create({ data: { ...parsed.data, photoUrl: parsed.data.photoUrl ?? "" } });
  revalidatePath("/admin/specialists");
  return { success: true };
}

export async function updateSpecialistAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  const parsed = specialistSchema.safeParse({
    slug: formData.get("slug"), nameTr: formData.get("nameTr"), nameEn: formData.get("nameEn"),
    titleTr: formData.get("titleTr"), titleEn: formData.get("titleEn"),
    biographyTr: formData.get("biographyTr"), biographyEn: formData.get("biographyEn"),
    photoUrl: formData.get("photoUrl") ?? "", order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  const conflict = await prisma.specialist.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (conflict) return { success: false, error: "Bu slug zaten kullanımda" };
  await prisma.specialist.update({ where: { id }, data: { ...parsed.data, photoUrl: parsed.data.photoUrl ?? "" } });
  revalidatePath("/admin/specialists");
  return { success: true };
}

export async function deleteSpecialistAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.specialist.delete({ where: { id } });
  revalidatePath("/admin/specialists");
  return { success: true };
}

export async function assignServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const specialistId = formData.get("specialistId") as string;
  const serviceId = formData.get("serviceId") as string;
  if (!specialistId || !serviceId) return { success: false, error: "Uzman ve hizmet seçimi gerekli" };
  await prisma.specialistService.upsert({
    where: { specialistId_serviceId: { specialistId, serviceId } },
    update: {},
    create: { specialistId, serviceId },
  });
  revalidatePath("/admin/specialists");
  return { success: true };
}

export async function removeServiceAssignmentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.specialistService.delete({ where: { id } });
  revalidatePath("/admin/specialists");
  return { success: true };
}
