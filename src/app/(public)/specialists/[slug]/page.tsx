import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpecialistDetailClient from "@/components/public/SpecialistDetailClient";
import { resolveSpecialistPhotoUrl } from "@/lib/image-fallbacks";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;

export async function generateStaticParams() {
  const specialists = await safeQuery(
    "specialist static params",
    () =>
      prisma.specialist.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
    []
  );

  return specialists.map((specialist) => ({ slug: specialist.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [settings, row] = await Promise.all([
    getSiteSettings(),
    safeQuery(
      `specialist metadata ${slug}`,
      () =>
        prisma.specialist.findFirst({
          where: { slug, isActive: true },
          select: {
            nameTr: true,
            titleTr: true,
            photoUrl: true,
          },
        }),
      null
    ),
  ]);

  if (!row) {
    return await buildPublicPageMetadata({
      settings,
      title: `Uzman Bulunamadı | ${settings.clinicName}`,
      description: settings.seoDescTr,
      path: `/specialists/${slug}`,
    });
  }

  return await buildPublicPageMetadata({
    settings,
    title: `${row.nameTr} | ${settings.clinicName}`,
    description: row.titleTr,
    path: `/specialists/${slug}`,
    imageUrl: resolveSpecialistPhotoUrl(slug, row.photoUrl),
  });
}

export default async function SpecialistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await safeQuery(
    `specialist detail ${slug}`,
    () =>
      prisma.specialist.findFirst({
        where: { slug, isActive: true },
        include: { specialistServices: { include: { service: true } } },
      }),
    null
  );

  if (!row) {
    notFound();
  }

  const specialist = {
    id: row.id,
    slug: row.slug,
    nameTr: row.nameTr,
    nameEn: row.nameEn,
    titleTr: row.titleTr,
    titleEn: row.titleEn,
    biographyTr: row.biographyTr,
    biographyEn: row.biographyEn,
    photoUrl: resolveSpecialistPhotoUrl(row.slug, row.photoUrl),
    specialistServices: row.specialistServices.map((specialistService) => ({
      service: {
        id: specialistService.service.id,
        slug: specialistService.service.slug,
        nameTr: specialistService.service.nameTr,
        nameEn: specialistService.service.nameEn,
      },
    })),
  };

  const specialistJsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: row.nameTr,
    description: row.titleTr,
    medicalSpecialty: row.specialistServices.map((specialistService) => specialistService.service.nameTr),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(specialistJsonLd) }} />
      <SpecialistDetailClient specialist={specialist} />
    </>
  );
}
