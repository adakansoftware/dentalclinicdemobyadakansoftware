import { prisma } from "@/lib/prisma";
import SpecialistsClient from "@/components/public/SpecialistsClient";

export const revalidate = 60;

export default async function SpecialistsPage() {
  const specialists = await prisma.specialist.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { specialistServices: { include: { service: true } } },
  });
  return <SpecialistsClient specialists={specialists} />;
}
