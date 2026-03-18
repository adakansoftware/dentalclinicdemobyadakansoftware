import { prisma } from "@/lib/prisma";
import SpecialistsClient from "@/components/public/SpecialistsClient";

export const revalidate = 60;

export default async function SpecialistsPage() {
  const rows = await prisma.specialist.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { specialistServices: { include: { service: true } } },
  });

  const specialists = rows.map((sp) => ({
    id: sp.id, slug: sp.slug, nameTr: sp.nameTr, nameEn: sp.nameEn,
    titleTr: sp.titleTr, titleEn: sp.titleEn,
    biographyTr: sp.biographyTr, biographyEn: sp.biographyEn,
    photoUrl: sp.photoUrl, order: sp.order, isActive: sp.isActive,
    specialistServices: sp.specialistServices.map((ss) => ({
      service: {
        id: ss.service.id, slug: ss.service.slug,
        nameTr: ss.service.nameTr, nameEn: ss.service.nameEn,
        shortDescTr: ss.service.shortDescTr, shortDescEn: ss.service.shortDescEn,
        descriptionTr: ss.service.descriptionTr, descriptionEn: ss.service.descriptionEn,
        iconName: ss.service.iconName, durationMinutes: ss.service.durationMinutes,
        order: ss.service.order, isActive: ss.service.isActive,
      },
    })),
  }));

  return <SpecialistsClient specialists={specialists} />;
}
