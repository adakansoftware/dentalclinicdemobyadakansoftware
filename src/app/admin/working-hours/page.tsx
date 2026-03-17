import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminWorkingHoursClient from "@/components/admin/AdminWorkingHoursClient";

export const dynamic = "force-dynamic";

export default async function AdminWorkingHoursPage() {
  await requireAdmin();
  const [specialists, workingHours] = await Promise.all([
    prisma.specialist.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.workingHour.findMany({ include: { specialist: { select: { nameTr: true } } } }),
  ]);
  return <AdminWorkingHoursClient specialists={specialists} workingHours={workingHours} />;
}
