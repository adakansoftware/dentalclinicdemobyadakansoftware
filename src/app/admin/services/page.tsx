import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminServicesClient from "@/components/admin/AdminServicesClient";
import type { ServiceData } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireAdmin();
  const rows = await prisma.service.findMany({ orderBy: { order: "asc" } });
  const services: ServiceData[] = rows.map((s) => ({
    id: s.id, slug: s.slug, nameTr: s.nameTr, nameEn: s.nameEn,
    shortDescTr: s.shortDescTr, shortDescEn: s.shortDescEn,
    descriptionTr: s.descriptionTr, descriptionEn: s.descriptionEn,
    iconName: s.iconName, durationMinutes: s.durationMinutes,
    order: s.order, isActive: s.isActive,
  }));
  return <AdminServicesClient services={services} />;
}
