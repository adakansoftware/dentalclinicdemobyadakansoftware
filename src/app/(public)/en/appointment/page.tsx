import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export { default } from "../../appointment/page";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Online Appointment | ${settings.clinicNameEn}`,
    description: "Book your dental clinic appointment quickly and securely.",
    path: "/en/appointment",
    locale: "en",
  });
}
