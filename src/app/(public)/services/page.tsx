import { prisma } from "@/lib/prisma";
import ServicesClient from "@/components/public/ServicesClient";

export const revalidate = 60;

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return <ServicesClient services={services} />;
}
