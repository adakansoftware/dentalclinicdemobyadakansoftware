import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSpecialistsClient from "@/components/admin/AdminSpecialistsClient";

export const dynamic = "force-dynamic";

export default async function AdminSpecialistsPage() {
  await requireAdmin();
  const [specialists, services] = await Promise.all([
    prisma.specialist.findMany({
      orderBy: { order: "asc" },
      include: { specialistServices: { include: { service: true } } },
    }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);
  return <AdminSpecialistsClient specialists={specialists} services={services} />;
}
