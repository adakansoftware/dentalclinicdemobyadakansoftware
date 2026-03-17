import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppointmentsClient from "@/components/admin/AppointmentsClient";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.status && params.status !== "ALL") where.status = params.status;
  if (params.search) {
    where.OR = [
      { patientName: { contains: params.search, mode: "insensitive" } },
      { patientPhone: { contains: params.search } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    include: { service: true, specialist: true },
  });

  return (
    <AppointmentsClient
      appointments={appointments.map((a) => ({
        ...a,
        date: a.date.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))}
    />
  );
}
