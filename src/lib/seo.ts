import type { Metadata } from "next";
import type { SiteSettings } from "@/types";
import { getOptionalEnv } from "./env";

const DEFAULT_SOCIAL_IMAGE = "/images/hero.jpg";

export function getBaseUrl(): URL {
  const env = getOptionalEnv();
  const raw =
    env.NEXT_PUBLIC_APP_URL ||
    env.NEXT_PUBLIC_SITE_URL ||
    env.NEXTAUTH_URL ||
    env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000";
  const normalized = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return new URL(normalized);
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, getBaseUrl()).toString();
}

export function toAbsoluteAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}

interface PublicPageMetadataInput {
  settings: SiteSettings;
  title: string;
  description: string;
  path?: string;
  imageUrl?: string | null;
}

export function buildPublicPageMetadata({
  settings,
  title,
  description,
  path = "/",
  imageUrl,
}: PublicPageMetadataInput): Metadata {
  const resolvedImage = toAbsoluteAssetUrl(imageUrl || settings.logoUrl || settings.faviconUrl || DEFAULT_SOCIAL_IMAGE);

  return {
    metadataBase: getBaseUrl(),
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteUrl(path),
      siteName: settings.clinicName,
      images: resolvedImage
        ? [
            {
              url: resolvedImage,
              width: 1200,
              height: 630,
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

export function buildClinicJsonLd(settings: SiteSettings) {
  const sameAs = [settings.instagram, settings.facebook, settings.twitter].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: settings.clinicName,
    telephone: settings.phone,
    email: settings.email || undefined,
    address: settings.address ? { "@type": "PostalAddress", streetAddress: settings.address } : undefined,
    url: absoluteUrl("/"),
    image: toAbsoluteAssetUrl(settings.logoUrl || settings.faviconUrl || DEFAULT_SOCIAL_IMAGE),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}
