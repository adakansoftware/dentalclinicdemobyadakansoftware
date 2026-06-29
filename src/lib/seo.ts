import type { Metadata } from "next";
import type { SiteSettings } from "@/types";
import { headers } from "next/headers";
import { getOptionalEnv } from "./env.ts";
import { sanitizeAssetReference } from "./upload-assets.ts";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH } from "./social-preview.ts";

const DEFAULT_SOCIAL_IMAGE = SOCIAL_IMAGE_PATH;

function getConfiguredBaseUrl(): URL {
  const env = getOptionalEnv();
  const raw =
    env.NEXT_PUBLIC_APP_URL ||
    env.NEXT_PUBLIC_SITE_URL ||
    env.NEXTAUTH_URL ||
    env.VERCEL_URL ||
    env.VERCEL_BRANCH_URL ||
    env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000";
  const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return new URL(normalized);
}

function getBaseUrlFromRequestHeaders(headerStore: Headers): URL | null {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return null;
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  try {
    return new URL(`${protocol}://${host}`);
  } catch {
    return null;
  }
}

export function getBaseUrl(): URL {
  return getConfiguredBaseUrl();
}

export async function getRequestBaseUrl(): Promise<URL> {
  const headerStore = await headers();
  return getBaseUrlFromRequestHeaders(headerStore) ?? getConfiguredBaseUrl();
}

export function absoluteUrl(path = "/", baseUrl = getBaseUrl()): string {
  return new URL(path, baseUrl).toString();
}

export function toAbsoluteAssetUrl(url?: string | null, baseUrl = getBaseUrl()): string | undefined {
  const safeUrl = sanitizeAssetReference(url);
  if (!safeUrl) return undefined;
  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) return safeUrl;
  return absoluteUrl(safeUrl.startsWith("/") ? safeUrl : `/${safeUrl}`, baseUrl);
}

interface PublicPageMetadataInput {
  settings: SiteSettings;
  title: string;
  description: string;
  path?: string;
  imageUrl?: string | null;
}

export async function buildPublicPageMetadata({
  settings,
  title,
  description,
  path = "/",
  imageUrl,
}: PublicPageMetadataInput): Promise<Metadata> {
  const baseUrl = await getRequestBaseUrl();
  const resolvedImage = toAbsoluteAssetUrl(
    imageUrl || settings.logoUrl || settings.faviconUrl || DEFAULT_SOCIAL_IMAGE,
    baseUrl
  );

  return {
    metadataBase: baseUrl,
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteUrl(path, baseUrl),
      siteName: settings.clinicName,
      images: resolvedImage
        ? [
            {
              url: resolvedImage,
              width: SOCIAL_IMAGE_WIDTH,
              height: SOCIAL_IMAGE_HEIGHT,
              alt: settings.clinicName,
            },
          ]
        : undefined,
      locale: "tr_TR",
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title,
      description,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export async function buildClinicJsonLd(settings: SiteSettings) {
  const baseUrl = await getRequestBaseUrl();
  const sameAs = [settings.instagram, settings.facebook, settings.twitter].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: settings.clinicName,
    telephone: settings.phone,
    email: settings.email || undefined,
    address: settings.address ? { "@type": "PostalAddress", streetAddress: settings.address } : undefined,
    url: absoluteUrl("/", baseUrl),
    image: toAbsoluteAssetUrl(settings.logoUrl || settings.faviconUrl || DEFAULT_SOCIAL_IMAGE, baseUrl),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}
