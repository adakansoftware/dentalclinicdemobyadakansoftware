"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAdminMutation } from "@/lib/admin-mutation";
import { IMAGE_INPUT_SCHEMA_MESSAGE, isValidAssetInput, persistImageAsset } from "@/lib/upload-assets";
import type { ActionResult } from "@/types";

const SERVICE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const SERVICE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

const serviceSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug sadece kucuk harf, rakam ve tire icerebilir"),
  nameTr: z.string().min(2, "Turkce ad gerekli"),
  nameEn: z.string().min(2, "Ingilizce ad gerekli"),
  shortDescTr: z.string().min(5, "Turkce kisa aciklama gerekli"),
  shortDescEn: z.string().min(5, "Ingilizce kisa aciklama gerekli"),
  descriptionTr: z.string().min(10, "Turkce aciklama gerekli"),
  descriptionEn: z.string().min(10, "Ingilizce aciklama gerekli"),
  iconName: z.string().default("tooth"),
  durationMinutes: z.coerce.number().min(15).max(480),
  order: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
  imageUrl: z.string().trim().refine(isValidAssetInput, IMAGE_INPUT_SCHEMA_MESSAGE).optional().or(z.literal("")),
});

async function resolveServiceImage(value: string | undefined, existingValue?: string | null) {
  if (!value?.trim()) {
    if (existingValue) {
      await persistImageAsset({
        category: "services",
        value: "",
        existingValue,
        allowedMimeTypes: SERVICE_IMAGE_TYPES,
        maxBytes: SERVICE_IMAGE_MAX_BYTES,
      });
    }
    return null;
  }

  return persistImageAsset({
    category: "services",
    value,
    existingValue,
    allowedMimeTypes: SERVICE_IMAGE_TYPES,
    maxBytes: SERVICE_IMAGE_MAX_BYTES,
  });
}

export async function createServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
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
    imageUrl: formData.get("imageUrl") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const exists = await prisma.service.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (exists) {
    return { success: false, error: "Bu slug zaten kullanimda" };
  }

  let imageUrl: string | null = null;
  try {
    imageUrl = await resolveServiceImage(parsed.data.imageUrl);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gorsel kaydedilemedi.",
    };
  }

  return runAdminMutation({
    route: "action:createService",
    event: "service_created",
    execute: async () => {
      await prisma.service.create({
        data: {
          ...parsed.data,
          imageUrl,
        },
      });

      return {
        meta: {
          slug: parsed.data.slug,
          isActive: parsed.data.isActive,
          hasImage: Boolean(imageUrl),
        },
        revalidate: ["/admin/services", "/", "/services"],
      };
    },
    getErrorMessage: () => "Hizmet olusturulamadi",
  });
}

export async function updateServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "ID gerekli" };
  }

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
    imageUrl: formData.get("imageUrl") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const conflict = await prisma.service.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });

  if (conflict) {
    return { success: false, error: "Bu slug zaten kullanimda" };
  }

  const existing = await prisma.service.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  let imageUrl: string | null = null;
  try {
    imageUrl = await resolveServiceImage(parsed.data.imageUrl, existing?.imageUrl);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gorsel kaydedilemedi.",
    };
  }

  return runAdminMutation({
    route: "action:updateService",
    event: "service_updated",
    execute: async () => {
      await prisma.service.update({
        where: { id },
        data: {
          ...parsed.data,
          imageUrl,
        },
      });

      return {
        meta: {
          serviceId: id,
          slug: parsed.data.slug,
          isActive: parsed.data.isActive,
          hasImage: Boolean(imageUrl),
        },
        revalidate: ["/admin/services", "/", "/services", `/services/${parsed.data.slug}`],
      };
    },
    getErrorMessage: () => "Hizmet guncellenemedi",
  });
}

export async function deleteServiceAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "ID gerekli" };
  }

  const existing = await prisma.service.findUnique({
    where: { id },
    select: { imageUrl: true, slug: true },
  });

  if (existing?.imageUrl) {
    await persistImageAsset({
      category: "services",
      value: "",
      existingValue: existing.imageUrl,
      allowedMimeTypes: SERVICE_IMAGE_TYPES,
      maxBytes: SERVICE_IMAGE_MAX_BYTES,
    });
  }

  return runAdminMutation({
    route: "action:deleteService",
    event: "service_deleted",
    execute: async () => {
      await prisma.service.delete({ where: { id } });

      return {
        meta: {
          serviceId: id,
          slug: existing?.slug,
        },
        revalidate: ["/admin/services", "/", "/services"],
      };
    },
    getErrorMessage: () => "Hizmet silinemedi",
  });
}
