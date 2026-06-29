import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetailClient from "@/components/public/ServiceDetailClient";
import { resolveServiceImageUrl, resolveSpecialistPhotoUrl } from "@/lib/image-fallbacks";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [settings, row] = await Promise.all([
    getSiteSettings(),
    safeQuery(
      `service metadata ${slug}`,
      () =>
        prisma.service.findFirst({
          where: { slug, isActive: true },
          select: {
            nameTr: true,
            shortDescTr: true,
            imageUrl: true,
          },
        }),
      null
    ),
  ]);

  if (!row) {
    return await buildPublicPageMetadata({
      settings,
      title: `Hizmet Bulunamadı | ${settings.clinicName}`,
      description: settings.seoDescTr,
      path: `/services/${slug}`,
    });
  }

  return await buildPublicPageMetadata({
    settings,
    title: `${row.nameTr} | ${settings.clinicName}`,
    description: row.shortDescTr,
    path: `/services/${slug}`,
    imageUrl: resolveServiceImageUrl(slug, row.imageUrl),
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const row = await safeQuery(
    `service detail ${slug}`,
    () =>
      prisma.service.findFirst({
        where: { slug, isActive: true },
        include: {
          specialistServices: {
            include: {
              specialist: {
                select: {
                  id: true,
                  slug: true,
                  nameTr: true,
                  nameEn: true,
                  titleTr: true,
                  titleEn: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      }),
    null
  );

  if (!row) {
    notFound();
  }

  const service = {
    id: row.id,
    slug: row.slug,
    nameTr: row.nameTr,
    nameEn: row.nameEn,
    descriptionTr: row.descriptionTr,
    descriptionEn: row.descriptionEn,
    shortDescTr: row.shortDescTr,
    shortDescEn: row.shortDescEn,
    iconName: row.iconName,
    durationMinutes: row.durationMinutes,
    imageUrl: resolveServiceImageUrl(row.slug, row.imageUrl),
    specialistServices: row.specialistServices.map((specialistService) => ({
      specialist: {
        ...specialistService.specialist,
        photoUrl: resolveSpecialistPhotoUrl(
          specialistService.specialist.slug,
          specialistService.specialist.photoUrl
        ),
      },
    })),
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: row.nameTr,
    description: row.shortDescTr,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <ServiceDetailClient service={service} />
    </>
  );
}
