import type { Metadata } from "next";
import ServicesClient from "@/components/public/ServicesClient";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { resolveServiceImageUrl } from "@/lib/image-fallbacks";
import { getSiteSettings } from "@/lib/settings";
import type { ServiceData } from "@/types";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildPublicPageMetadata({
    settings,
    title: `Hizmetler | ${settings.clinicName}`,
    description: `${settings.clinicName} tarafından sunulan tedavi ve diş sağlığı hizmetleri.`,
    path: "/services",
  });
}

export default async function ServicesPage() {
  const rows = await safeQuery(
    "services list",
    () => prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    []
  );
  const services: ServiceData[] = rows.map((service) => ({
    id: service.id,
    slug: service.slug,
    nameTr: service.nameTr,
    nameEn: service.nameEn,
    shortDescTr: service.shortDescTr,
    shortDescEn: service.shortDescEn,
    descriptionTr: service.descriptionTr,
    descriptionEn: service.descriptionEn,
    iconName: service.iconName,
    durationMinutes: service.durationMinutes,
    order: service.order,
    isActive: service.isActive,
    imageUrl: resolveServiceImageUrl(service.slug, service.imageUrl),
  }));

  return <ServicesClient services={services} />;
}
