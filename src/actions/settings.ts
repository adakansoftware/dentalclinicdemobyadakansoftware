"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAdminMutation } from "@/lib/admin-mutation";
import { getGoogleMapsEmbedError } from "@/lib/maps";
import { IMAGE_INPUT_SCHEMA_MESSAGE, isValidAssetInput, persistImageAsset } from "@/lib/upload-assets";
import type { ActionResult } from "@/types";

const BRANDING_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"] as const;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_MAX_BYTES = 1024 * 1024;

const optionalUrl = z.string().trim().url("Geçerli bir URL girin").or(z.literal(""));
const optionalAsset = z.string().trim().refine(isValidAssetInput, IMAGE_INPUT_SCHEMA_MESSAGE);
const optionalEmail = z.string().trim().email("Geçerli bir e-posta girin").or(z.literal(""));
const phoneSchema = z.string().trim().min(6, "Geçerli telefon girin").max(30).regex(/^[\d\s+\-()]+$/);

const settingsSchema = z.object({
  clinicName: z.string().trim().min(2).max(120),
  clinicNameEn: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  whatsapp: phoneSchema.or(z.literal("")),
  email: optionalEmail,
  address: z.string().trim().min(3).max(200),
  addressEn: z.string().trim().min(3).max(200),
  mapEmbedUrl: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  twitter: optionalUrl,
  heroTitleTr: z.string().trim().min(3).max(150),
  heroTitleEn: z.string().trim().min(3).max(150),
  heroSubtitleTr: z.string().trim().min(3).max(400),
  heroSubtitleEn: z.string().trim().min(3).max(400),
  aboutTitleTr: z.string().trim().min(2).max(120),
  aboutTitleEn: z.string().trim().min(2).max(120),
  aboutTextTr: z.string().trim().min(3).max(4000),
  aboutTextEn: z.string().trim().min(3).max(4000),
  seoTitleTr: z.string().trim().min(2).max(160),
  seoTitleEn: z.string().trim().min(2).max(160),
  seoDescTr: z.string().trim().min(3).max(320),
  seoDescEn: z.string().trim().min(3).max(320),
  logoUrl: optionalAsset,
  faviconUrl: optionalAsset,
});

async function getExistingSettings(keys: string[]) {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });

  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export async function updateSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(
    Array.from(formData.entries()).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Ayarlar doğrulanamadı" };
  }

  const mapEmbedError = getGoogleMapsEmbedError(parsed.data.mapEmbedUrl);
  if (mapEmbedError) {
    return { success: false, error: mapEmbedError };
  }

  const existingAssets = await getExistingSettings(["logoUrl", "faviconUrl"]);

  let logoUrl = parsed.data.logoUrl;
  let faviconUrl = parsed.data.faviconUrl;

  try {
    logoUrl = await persistImageAsset({
      category: "branding",
      value: parsed.data.logoUrl,
      existingValue: existingAssets.logoUrl,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: LOGO_MAX_BYTES,
    });

    faviconUrl = await persistImageAsset({
      category: "branding",
      value: parsed.data.faviconUrl,
      existingValue: existingAssets.faviconUrl,
      allowedMimeTypes: BRANDING_IMAGE_TYPES,
      maxBytes: FAVICON_MAX_BYTES,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Marka görselleri kaydedilemedi.",
    };
  }

  const payload = {
    ...parsed.data,
    logoUrl,
    faviconUrl,
  };

  return runAdminMutation({
    route: "action:updateSettings",
    event: "settings_updated",
    requireStepUp: true,
    stepUpPassword: String(formData.get("stepUpPassword") ?? ""),
    execute: async () => {
      await Promise.all(
        Object.entries(payload).map(([key, value]) =>
          prisma.siteSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          })
        )
      );

      return {
        meta: {
          hasLogo: Boolean(payload.logoUrl),
          hasFavicon: Boolean(payload.faviconUrl),
          hasMapEmbed: Boolean(payload.mapEmbedUrl),
        },
        revalidate: [{ path: "/", type: "layout" }, "/admin/settings"],
      };
    },
    getErrorMessage: () => "Ayarlar kaydedilemedi",
  });
}
