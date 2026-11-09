import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export { default } from "../../faq/page";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Frequently Asked Questions | ${settings.clinicNameEn}`,
    description: `Common questions and answers about ${settings.clinicNameEn}.`,
    path: "/en/faq",
    locale: "en",
  });
}
