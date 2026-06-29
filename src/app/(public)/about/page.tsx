import type { Metadata } from "next";
import AboutClient from "@/components/public/AboutClient";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Hakkımızda | ${settings.clinicName}`,
    description: settings.aboutTextTr.slice(0, 160),
    path: "/about",
  });
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return <AboutClient settings={settings} />;
}
