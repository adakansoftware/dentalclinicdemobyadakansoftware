import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export { default } from "../../contact/page";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Contact | ${settings.clinicNameEn}`,
    description: `${settings.clinicNameEn} contact details, address, and working hours.`,
    path: "/en/contact",
    locale: "en",
  });
}
