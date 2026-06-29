import type { Metadata } from "next";
import ContactClient from "@/components/public/ContactClient";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildClinicJsonLd, buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `İletişim | ${settings.clinicName}`,
    description: `${settings.clinicName} iletişim bilgileri, adres ve çalışma saatleri.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const [settings, workingHours] = await Promise.all([
    getSiteSettings(),
    safeQuery(
      "contact working hours",
      () =>
        prisma.workingHour.findMany({
          where: { specialist: { isActive: true } },
          orderBy: { dayOfWeek: "asc" },
          distinct: ["dayOfWeek"],
        }),
      []
    ),
  ]);

  const clinicJsonLd = await buildClinicJsonLd(settings);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd) }} />
      <ContactClient settings={settings} workingHours={workingHours} />
    </>
  );
}
