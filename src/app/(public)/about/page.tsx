import { getSiteSettings } from "@/lib/settings";
import AboutClient from "@/components/public/AboutClient";

export const revalidate = 60;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return <AboutClient settings={settings} />;
}
