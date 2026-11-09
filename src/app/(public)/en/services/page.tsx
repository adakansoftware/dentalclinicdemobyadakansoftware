import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export { default } from "../../services/page";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Treatments | ${settings.clinicNameEn}`,
    description: `Dental treatments and services offered by ${settings.clinicNameEn}.`,
    path: "/en/services",
    locale: "en",
  });
}
