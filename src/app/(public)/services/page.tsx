import { prisma } from "@/lib/prisma";
import ServicesClient from "@/components/public/ServicesClient";
import type { ServiceData } from "@/types";

export const revalidate = 60;

export default async function ServicesPage() {
  const rows = await prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  const services: ServiceData[] = rows.map((s) => ({
    id: s.id, slug: s.slug, nameTr: s.nameTr, nameEn: s.nameEn,
    shortDescTr: s.shortDescTr, shortDescEn: s.shortDescEn,
    descriptionTr: s.descriptionTr, descriptionEn: s.descriptionEn,
    iconName: s.iconName, durationMinutes: s.durationMinutes,
    order: s.order, isActive: s.isActive,
  }));
  return <ServicesClient services={services} />;
}
