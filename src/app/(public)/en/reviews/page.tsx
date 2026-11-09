import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export { default } from "../../reviews/page";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Patient Reviews | ${settings.clinicNameEn}`,
    description: `Read approved patient reviews for ${settings.clinicNameEn}.`,
    path: "/en/reviews",
    locale: "en",
  });
}
