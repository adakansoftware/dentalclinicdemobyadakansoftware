import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/seo";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH, TWITTER_IMAGE_PATH } from "@/lib/social-preview";
import "./globals.css";

const defaultTitle = "Adakan Dental Klinik | Modern Dis Klinigi Demo";
const defaultDescription = "Dis klinikleri icin modern, mobil uyumlu, online randevu destekli web sitesi demosu.";

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: defaultTitle,
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: SOCIAL_IMAGE_PATH,
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
    images: [TWITTER_IMAGE_PATH],
  },
  verification: {
    google: "F9CjZoLhgyYJb2LPXCUGlNthcunJ53kN_RQqINd2ZUU",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
