import type { ReactNode } from "react";
import { getSiteSettings } from "@/lib/settings";
import { buildPublicPageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { LangProvider } from "@/context/LangContext";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import ConversionDock from "@/components/public/ConversionDock";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return await buildPublicPageMetadata({
    settings,
    title: settings.seoTitleTr,
    description: settings.seoDescTr,
    path: "/",
  });
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, workingHours] = await Promise.all([
    getSiteSettings(),
    safeQuery(
      "public layout working hours",
      () =>
        prisma.workingHour.findMany({
          where: { specialist: { isActive: true }, isOpen: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          distinct: ["dayOfWeek"],
        }),
      []
    ),
  ]);

  const hoursLabel = workingHours.length ? `${workingHours[0]?.startTime ?? ""} - ${workingHours[0]?.endTime ?? ""}`.trim() : "";

  return (
    <LangProvider>
      <div className="min-h-screen">
        <PublicNavbar settings={settings} hoursLabel={hoursLabel} />
      <main>{children}</main>
      <ConversionDock settings={settings} />
      <PublicFooter settings={settings} />
      </div>
    </LangProvider>
  );
}
