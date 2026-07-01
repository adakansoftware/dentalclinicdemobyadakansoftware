import type { Metadata } from "next";
import { getRequestBaseUrl } from "@/lib/seo";
import {
  getSocialImageMimeType,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_PATH,
  SOCIAL_IMAGE_WIDTH,
  TWITTER_IMAGE_PATH,
} from "@/lib/social-preview";
import "./globals.css";

const defaultTitle = "Adakan Dental Klinik | Modern Dis Klinigi Demo";
const defaultDescription = "Dis klinikleri icin modern, mobil uyumlu, online randevu destekli web sitesi demosu.";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getRequestBaseUrl();
  const socialImageUrl = new URL(SOCIAL_IMAGE_PATH, baseUrl).toString();
  const twitterImageUrl = new URL(TWITTER_IMAGE_PATH, baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title: defaultTitle,
    description: defaultDescription,
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      url: baseUrl.toString(),
      type: "website",
      siteName: "Adakan Dental Klinik",
      images: [
        {
          url: socialImageUrl,
          width: SOCIAL_IMAGE_WIDTH,
          height: SOCIAL_IMAGE_HEIGHT,
          alt: "Adakan Dental Klinik social preview",
          type: getSocialImageMimeType(socialImageUrl),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [
        {
          url: twitterImageUrl,
          alt: "Adakan Dental Klinik social preview",
        },
      ],
    },
    other: {
      "og:image": socialImageUrl,
      "og:image:url": socialImageUrl,
      "og:image:secure_url": socialImageUrl,
      "og:image:type": getSocialImageMimeType(socialImageUrl),
      "og:image:width": String(SOCIAL_IMAGE_WIDTH),
      "og:image:height": String(SOCIAL_IMAGE_HEIGHT),
      "og:image:alt": "Adakan Dental Klinik social preview",
      "twitter:image": twitterImageUrl,
      "twitter:image:src": twitterImageUrl,
      "twitter:image:alt": "Adakan Dental Klinik social preview",
    },
    verification: {
      google: "F9CjZoLhgyYJb2LPXCUGlNthcunJ53kN_RQqINd2ZUU",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
