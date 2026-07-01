import type { Metadata } from "next";
import type { SiteSettings } from "@/types";
import { getOptionalEnv } from "./env.ts";
import { sanitizeAssetReference } from "./upload-assets.ts";
import { getSocialImageMimeType, SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH } from "./social-preview.ts";

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

export function getBaseUrl(): URL {
  return getConfiguredBaseUrl();
}

export async function getRequestBaseUrl(): Promise<URL> {
  return getConfiguredBaseUrl();
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

function resolveSocialPreviewImage(
  baseUrl: URL,
  preferredImage?: string | null,
  fallbackImage?: string | null
): string | undefined {
  return (
    toAbsoluteAssetUrl(preferredImage, baseUrl) ||
    toAbsoluteAssetUrl(DEFAULT_SOCIAL_IMAGE, baseUrl) ||
    toAbsoluteAssetUrl(fallbackImage, baseUrl)
  );
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
  const resolvedImage = resolveSocialPreviewImage(baseUrl, imageUrl, settings.logoUrl || settings.faviconUrl);
  const imageMimeType = resolvedImage ? getSocialImageMimeType(resolvedImage) : undefined;

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
              type: imageMimeType,
            },
          ]
        : undefined,
      locale: "tr_TR",
    },
    twitter: {
      card: resolvedImage ? "summary_large_image" : "summary",
      title,
      description,
      images: resolvedImage
        ? [
            {
              url: resolvedImage,
              alt: settings.clinicName,
            },
          ]
        : undefined,
    },
    other: resolvedImage
      ? {
          "og:image": resolvedImage,
          "og:image:url": resolvedImage,
          "og:image:secure_url": resolvedImage,
          "og:image:type": imageMimeType ?? "image/jpeg",
          "og:image:width": String(SOCIAL_IMAGE_WIDTH),
          "og:image:height": String(SOCIAL_IMAGE_HEIGHT),
          "og:image:alt": settings.clinicName,
          "twitter:image": resolvedImage,
          "twitter:image:src": resolvedImage,
          "twitter:image:alt": settings.clinicName,
        }
      : undefined,
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
