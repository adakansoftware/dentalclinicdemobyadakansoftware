import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminServicesClient from "@/components/admin/AdminServicesClient";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });
  return <AdminServicesClient services={services} />;
}
