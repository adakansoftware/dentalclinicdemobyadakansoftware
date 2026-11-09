import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export { default } from "../../specialists/page";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Our Specialists | ${settings.clinicNameEn}`,
    description: `Meet the specialist clinical team of ${settings.clinicNameEn}.`,
    path: "/en/specialists",
    locale: "en",
  });
}
