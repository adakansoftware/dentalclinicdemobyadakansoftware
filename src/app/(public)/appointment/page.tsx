import { prisma } from "@/lib/prisma";
import AppointmentClient from "@/components/public/AppointmentClient";
import type { ServiceData } from "@/types";

export const revalidate = 0;

export default async function AppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; specialist?: string }>;
}) {
  const params = await searchParams;

  const [svcRows, spRows] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.specialist.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { specialistServices: { select: { serviceId: true } } },
    }),
  ]);

  const services: ServiceData[] = svcRows.map((s) => ({
    id: s.id, slug: s.slug, nameTr: s.nameTr, nameEn: s.nameEn,
    shortDescTr: s.shortDescTr, shortDescEn: s.shortDescEn,
    descriptionTr: s.descriptionTr, descriptionEn: s.descriptionEn,
    iconName: s.iconName, durationMinutes: s.durationMinutes,
    order: s.order, isActive: s.isActive,
  }));

  const specialists = spRows.map((sp) => ({
    id: sp.id, nameTr: sp.nameTr, nameEn: sp.nameEn,
    titleTr: sp.titleTr, titleEn: sp.titleEn,
    photoUrl: sp.photoUrl,
    specialistServices: sp.specialistServices,
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
