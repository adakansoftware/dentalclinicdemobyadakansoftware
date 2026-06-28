import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { getAllowedOrigins } from "./api-security.ts";
import { SOCIAL_IMAGE_PATH, TWITTER_IMAGE_PATH } from "./social-preview.ts";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const ALLOWED_LOCAL_ASSET_PREFIXES = ["/uploads/", "/images/"] as const;
const ALLOWED_EXACT_ASSET_PATHS = new Set([SOCIAL_IMAGE_PATH, TWITTER_IMAGE_PATH]);

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
} as const;

type AllowedMimeType = keyof typeof MIME_EXTENSION_MAP;

interface PersistOptions {
  category: "branding" | "services" | "specialists";
  value: string;
  existingValue?: string | null;
  allowedMimeTypes: readonly AllowedMimeType[];
  maxBytes: number;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isLocalUploadPath(value: string) {
  return value.startsWith("/uploads/");
}

function hasUnsafePathSegments(value: string) {
  return value.includes("..") || /[\r\n\t]/.test(value);
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "").toLowerCase();
}

export function isAllowedLocalAssetPath(value: string) {
  if (!value.startsWith("/") || hasUnsafePathSegments(value)) {
    return false;
  }

  return ALLOWED_EXACT_ASSET_PATHS.has(value) || ALLOWED_LOCAL_ASSET_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function isAllowedAbsoluteAssetUrl(value: string) {
  if (!isHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    if (!getAllowedOrigins().has(normalizeOrigin(url.origin))) {
      return false;
    }

    return isAllowedLocalAssetPath(url.pathname);
  } catch {
    return false;
  }
}

export function sanitizeAssetReference(value?: string | null, fallback = "") {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  if (isAllowedLocalAssetPath(trimmed) || isAllowedAbsoluteAssetUrl(trimmed)) {
    return trimmed;
  }

  return fallback;
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw new Error("Görsel verisi okunamadı.");
  }

  return {
    mimeType: match[1].toLowerCase() as AllowedMimeType,
    base64: match[2].replace(/\s+/g, ""),
  };
}

function normalizeAssetValue(value: string) {
  return value.trim();
}

async function safeDeleteLocalUpload(value?: string | null) {
  if (!value || !isLocalUploadPath(value)) {
    return;
  }

  const relativePath = value.replace(/^\/+/, "");
  const filePath = path.join(PUBLIC_DIR, relativePath);
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadsDir = path.resolve(UPLOADS_DIR);

  if (!resolvedPath.startsWith(resolvedUploadsDir)) {
    return;
  }

  try {
    await unlink(resolvedPath);
  } catch {
    // Ignore missing files and keep the flow resilient.
  }
}

export async function persistImageAsset({
  category,
  value,
  existingValue,
  allowedMimeTypes,
  maxBytes,
}: PersistOptions) {
  const trimmed = normalizeAssetValue(value);

  if (!trimmed) {
    if (existingValue && isLocalUploadPath(existingValue)) {
      await safeDeleteLocalUpload(existingValue);
    }
    return "";
  }

  if (isAllowedAbsoluteAssetUrl(trimmed) || isAllowedLocalAssetPath(trimmed)) {
    if (existingValue && existingValue !== trimmed && isLocalUploadPath(existingValue)) {
      await safeDeleteLocalUpload(existingValue);
    }
    return trimmed;
  }

  if (!trimmed.startsWith("data:image/")) {
    throw new Error("Görsel alanı yalnızca yüklenen dosya veya güvenli yerel görsel yolu kabul eder.");
  }

  const { mimeType, base64 } = parseDataUrl(trimmed);

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Bu dosya türü desteklenmiyor.");
  }

  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length) {
    throw new Error("Boş dosya yüklenemiyor.");
  }

  if (buffer.length > maxBytes) {
    throw new Error("Dosya boyutu sınırı aşıldı.");
  }

  const directory = path.join(UPLOADS_DIR, category);
  await mkdir(directory, { recursive: true });

  const extension = MIME_EXTENSION_MAP[mimeType];
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(directory, fileName);
  await writeFile(filePath, buffer);

  if (existingValue && existingValue !== trimmed && isLocalUploadPath(existingValue)) {
    await safeDeleteLocalUpload(existingValue);
  }

  return `/uploads/${category}/${fileName}`;
}

export const IMAGE_INPUT_SCHEMA_MESSAGE = "Geçerli bir görsel girin.";

export function isValidAssetInput(value: string) {
  const trimmed = normalizeAssetValue(value);
  return (
    trimmed === "" ||
    trimmed.startsWith("data:image/") ||
    isAllowedAbsoluteAssetUrl(trimmed) ||
    isAllowedLocalAssetPath(trimmed)
  );
}
