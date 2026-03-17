import { getSiteSettings } from "@/lib/settings";
import { LangProvider } from "@/context/LangContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: { default: s.seoTitleTr, template: `%s | ${s.clinicName}` },
    description: s.seoDescTr,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <LangProvider>
      <style>{`
        :root {
          --color-primary: ${settings.primaryColor};
          --color-accent: ${settings.accentColor};
          --color-primary-dark: color-mix(in srgb, ${settings.primaryColor} 80%, black);
          --color-primary-light: color-mix(in srgb, ${settings.primaryColor} 10%, white);
        }
      `}</style>
      <PublicNavbar settings={settings} />
      <main>{children}</main>
      <PublicFooter settings={settings} />
    </LangProvider>
  );
}
