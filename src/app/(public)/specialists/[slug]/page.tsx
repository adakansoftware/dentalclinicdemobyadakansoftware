import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SpecialistDetailClient from "@/components/public/SpecialistDetailClient";

export const revalidate = 60;

export async function generateStaticParams() {
  const specialists = await prisma.specialist.findMany({ where: { isActive: true }, select: { slug: true } });
  return specialists.map((s) => ({ slug: s.slug }));
}

export default async function SpecialistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { slug, isActive: true },
    include: { specialistServices: { include: { service: true } } },
  });
  if (!specialist) notFound();
  return <SpecialistDetailClient specialist={specialist} />;
}
