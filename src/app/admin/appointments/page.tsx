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

  const rows = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    include: { service: true, specialist: true },
  });

  const appointments = rows.map((a) => ({
    id: a.id,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    patientEmail: a.patientEmail,
    patientNote: a.patientNote,
    adminNote: a.adminNote,
    date: a.date.toISOString(),
    startTime: a.startTime,
    endTime: a.endTime,
    status: a.status,
    patientLanguage: a.patientLanguage,
    smsSent: a.smsSent,
    createdAt: a.createdAt.toISOString(),
    service: { nameTr: a.service.nameTr },
    specialist: { nameTr: a.specialist.nameTr },
  }));

  return <AppointmentsClient appointments={appointments} />;
}
