"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAdminMutation } from "@/lib/admin-mutation";
import { IMAGE_INPUT_SCHEMA_MESSAGE, isValidAssetInput, persistImageAsset } from "@/lib/upload-assets";
import type { ActionResult } from "@/types";

const SPECIALIST_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SPECIALIST_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

const specialistSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  nameTr: z.string().min(2),
  nameEn: z.string().min(2),
  titleTr: z.string().min(2),
  titleEn: z.string().min(2),
  biographyTr: z.string().min(10),
  biographyEn: z.string().min(10),
  photoUrl: z.string().trim().refine(isValidAssetInput, IMAGE_INPUT_SCHEMA_MESSAGE).optional().or(z.literal("")),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
});

async function resolveSpecialistPhoto(value: string | undefined, existingValue?: string | null) {
  if (!value?.trim()) {
    if (existingValue) {
      await persistImageAsset({
        category: "specialists",
        value: "",
        existingValue,
        allowedMimeTypes: SPECIALIST_IMAGE_TYPES,
        maxBytes: SPECIALIST_IMAGE_MAX_BYTES,
      });
    }
    return "";
  }

  return persistImageAsset({
    category: "specialists",
    value,
    existingValue,
    allowedMimeTypes: SPECIALIST_IMAGE_TYPES,
    maxBytes: SPECIALIST_IMAGE_MAX_BYTES,
  });
}

export async function createSpecialistAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = specialistSchema.safeParse({
    slug: formData.get("slug"),
    nameTr: formData.get("nameTr"),
    nameEn: formData.get("nameEn"),
    titleTr: formData.get("titleTr"),
    titleEn: formData.get("titleEn"),
    biographyTr: formData.get("biographyTr"),
    biographyEn: formData.get("biographyEn"),
    photoUrl: formData.get("photoUrl") ?? "",
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const exists = await prisma.specialist.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (exists) {
    return { success: false, error: "Bu slug zaten kullanimda" };
  }

  let photoUrl = "";
  try {
    photoUrl = await resolveSpecialistPhoto(parsed.data.photoUrl);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fotograf kaydedilemedi.",
    };
  }

  return runAdminMutation({
    route: "action:createSpecialist",
    event: "specialist_created",
    execute: async () => {
      await prisma.specialist.create({
        data: {
          ...parsed.data,
          photoUrl,
        },
      });

      return {
        meta: {
          slug: parsed.data.slug,
          isActive: parsed.data.isActive,
          hasPhoto: Boolean(photoUrl),
        },
        revalidate: ["/admin/specialists", "/specialists", "/"],
      };
    },
    getErrorMessage: () => "Uzman olusturulamadi",
  });
}

export async function updateSpecialistAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "ID gerekli" };
  }

  const parsed = specialistSchema.safeParse({
    slug: formData.get("slug"),
    nameTr: formData.get("nameTr"),
    nameEn: formData.get("nameEn"),
    titleTr: formData.get("titleTr"),
    titleEn: formData.get("titleEn"),
    biographyTr: formData.get("biographyTr"),
    biographyEn: formData.get("biographyEn"),
    photoUrl: formData.get("photoUrl") ?? "",
    order: formData.get("order") ?? "0",
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const conflict = await prisma.specialist.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });

  if (conflict) {
    return { success: false, error: "Bu slug zaten kullanimda" };
  }

  const existing = await prisma.specialist.findUnique({
    where: { id },
    select: { photoUrl: true },
  });

  let photoUrl = "";
  try {
    photoUrl = await resolveSpecialistPhoto(parsed.data.photoUrl, existing?.photoUrl);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fotograf kaydedilemedi.",
    };
  }

  return runAdminMutation({
    route: "action:updateSpecialist",
    event: "specialist_updated",
    execute: async () => {
      await prisma.specialist.update({
        where: { id },
        data: {
          ...parsed.data,
          photoUrl,
        },
      });

      return {
        meta: {
          specialistId: id,
          slug: parsed.data.slug,
          isActive: parsed.data.isActive,
          hasPhoto: Boolean(photoUrl),
        },
        revalidate: ["/admin/specialists", "/specialists", "/"],
      };
    },
    getErrorMessage: () => "Uzman guncellenemedi",
  });
}

export async function deleteSpecialistAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "ID gerekli" };
  }

  const existing = await prisma.specialist.findUnique({
    where: { id },
    select: { photoUrl: true, slug: true },
  });

  if (existing?.photoUrl) {
    await persistImageAsset({
      category: "specialists",
      value: "",
      existingValue: existing.photoUrl,
      allowedMimeTypes: SPECIALIST_IMAGE_TYPES,
      maxBytes: SPECIALIST_IMAGE_MAX_BYTES,
    });
  }

  return runAdminMutation({
    route: "action:deleteSpecialist",
    event: "specialist_deleted",
    execute: async () => {
      await prisma.specialist.delete({ where: { id } });
      return {
        meta: {
          specialistId: id,
          slug: existing?.slug,
        },
        revalidate: ["/admin/specialists", "/specialists", "/"],
      };
    },
    getErrorMessage: () => "Uzman silinemedi",
  });
}

export async function assignServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const specialistId = formData.get("specialistId") as string;
  const serviceId = formData.get("serviceId") as string;

  if (!specialistId || !serviceId) {
    return { success: false, error: "Uzman ve hizmet secimi gerekli" };
  }

  return runAdminMutation({
    route: "action:assignService",
    event: "specialist_service_assigned",
    execute: async () => {
      await prisma.specialistService.upsert({
        where: { specialistId_serviceId: { specialistId, serviceId } },
        update: {},
        create: { specialistId, serviceId },
      });

      return {
        meta: {
          specialistId,
          serviceId,
        },
        revalidate: ["/admin/specialists"],
      };
    },
    getErrorMessage: () => "Hizmet atamasi yapilamadi",
  });
}

export async function removeServiceAssignmentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "ID gerekli" };
  }

  return runAdminMutation({
    route: "action:removeServiceAssignment",
    event: "specialist_service_removed",
    execute: async () => {
      await prisma.specialistService.delete({ where: { id } });
      return {
        meta: {
          assignmentId: id,
        },
        revalidate: ["/admin/specialists"],
      };
    },
    getErrorMessage: () => "Hizmet atamasi kaldirilamadi",
  });
}
