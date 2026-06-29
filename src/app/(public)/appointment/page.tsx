import type { Metadata } from "next";
import AppointmentClient from "@/components/public/AppointmentClient";
import { resolveSpecialistPhotoUrl } from "@/lib/image-fallbacks";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import type { ServiceData } from "@/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Online Randevu | ${settings.clinicName}`,
    description: "Diş kliniği randevunuzu hızlı ve güvenli şekilde oluşturun.",
    path: "/appointment",
  });
}

export default async function AppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; specialist?: string }>;
}) {
  const params = await searchParams;

  const [svcRows, spRows] = await Promise.all([
    safeQuery("appointment services", () => prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }), []),
    safeQuery(
      "appointment specialists",
      () =>
        prisma.specialist.findMany({
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: { specialistServices: { select: { serviceId: true } } },
        }),
      []
    ),
  ]);

  const services: ServiceData[] = svcRows.map((service) => ({
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
  }));

  const specialists = spRows.map((specialist) => ({
    id: specialist.id,
    nameTr: specialist.nameTr,
    nameEn: specialist.nameEn,
    titleTr: specialist.titleTr,
    titleEn: specialist.titleEn,
    photoUrl: resolveSpecialistPhotoUrl(specialist.slug, specialist.photoUrl),
    specialistServices: specialist.specialistServices,
  }));

  return (
    <AppointmentClient
      services={services}
      specialists={specialists}
      preselectedServiceId={params.service}
      preselectedSpecialistId={params.specialist}
    />
  );
}
