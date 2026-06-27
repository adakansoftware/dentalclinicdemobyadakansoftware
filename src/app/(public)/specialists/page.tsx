import type { Metadata } from "next";
import SpecialistsClient from "@/components/public/SpecialistsClient";
import { resolveSpecialistPhotoUrl } from "@/lib/image-fallbacks";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildPublicPageMetadata({
    settings,
    title: `Uzman Kadro | ${settings.clinicName}`,
    description: `${settings.clinicName} uzman doktor kadrosunu inceleyin.`,
    path: "/specialists",
  });
}

export default async function SpecialistsPage() {
  const rows = await safeQuery(
    "specialists list",
    () =>
      prisma.specialist.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: { specialistServices: { include: { service: true } } },
      }),
    []
  );

  const specialists = rows.map((specialist) => ({
    id: specialist.id,
    slug: specialist.slug,
    nameTr: specialist.nameTr,
    nameEn: specialist.nameEn,
    titleTr: specialist.titleTr,
    titleEn: specialist.titleEn,
    biographyTr: specialist.biographyTr,
    biographyEn: specialist.biographyEn,
    photoUrl: resolveSpecialistPhotoUrl(specialist.slug, specialist.photoUrl),
    order: specialist.order,
    isActive: specialist.isActive,
    specialistServices: specialist.specialistServices.map((specialistService) => ({
      service: {
        id: specialistService.service.id,
        slug: specialistService.service.slug,
        nameTr: specialistService.service.nameTr,
        nameEn: specialistService.service.nameEn,
        shortDescTr: specialistService.service.shortDescTr,
        shortDescEn: specialistService.service.shortDescEn,
        descriptionTr: specialistService.service.descriptionTr,
        descriptionEn: specialistService.service.descriptionEn,
        iconName: specialistService.service.iconName,
        durationMinutes: specialistService.service.durationMinutes,
        order: specialistService.service.order,
        isActive: specialistService.service.isActive,
      },
    })),
  }));

  return <SpecialistsClient specialists={specialists} />;
}
