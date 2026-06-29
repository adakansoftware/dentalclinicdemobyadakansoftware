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
      images: [
        {
          url: socialImageUrl,
          width: SOCIAL_IMAGE_WIDTH,
          height: SOCIAL_IMAGE_HEIGHT,
          alt: "Adakan Dental Klinik social preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDescription,
      images: [twitterImageUrl],
    },
    other: {
      "og:image:secure_url": socialImageUrl,
      "og:image:type": getSocialImageMimeType(socialImageUrl),
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
