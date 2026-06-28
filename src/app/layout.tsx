import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/seo";
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
        url: "/opengraph-image.jpg",
        width: 1344,
        height: 768,
        alt: "Adakan Dental Klinik hero gorseli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/twitter-image.jpg"],
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
