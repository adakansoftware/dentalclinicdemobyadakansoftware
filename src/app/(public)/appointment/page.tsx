import { prisma } from "@/lib/prisma";
import AppointmentClient from "@/components/public/AppointmentClient";

export const revalidate = 0;

export default async function AppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; specialist?: string }>;
}) {
  const params = await searchParams;

  const [services, specialists] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.specialist.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        specialistServices: { select: { serviceId: true } },
      },
    }),
  ]);

  return (
    <AppointmentClient
      services={services}
      specialists={specialists}
      preselectedServiceId={params.service}
      preselectedSpecialistId={params.specialist}
    />
  );
}
