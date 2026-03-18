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
  const row = await prisma.specialist.findUnique({
    where: { slug, isActive: true },
    include: { specialistServices: { include: { service: true } } },
  });
  if (!row) notFound();

  const specialist = {
    id: row.id, slug: row.slug, nameTr: row.nameTr, nameEn: row.nameEn,
    titleTr: row.titleTr, titleEn: row.titleEn,
    biographyTr: row.biographyTr, biographyEn: row.biographyEn,
    photoUrl: row.photoUrl,
    specialistServices: row.specialistServices.map((ss) => ({
      service: {
        id: ss.service.id, slug: ss.service.slug,
        nameTr: ss.service.nameTr, nameEn: ss.service.nameEn,
      },
    })),
  };

  return <SpecialistDetailClient specialist={specialist} />;
}
