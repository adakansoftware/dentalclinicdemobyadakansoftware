import type { Metadata } from "next";
import HomeClient from "@/components/public/HomeClient";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { getPublicReviews } from "@/lib/google-reviews";
import { buildClinicJsonLd, buildPublicPageMetadata } from "@/lib/seo";
import { resolveServiceImageUrl, resolveSpecialistPhotoUrl } from "@/lib/image-fallbacks";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildPublicPageMetadata({
    settings,
    title: settings.seoTitleTr,
    description: settings.seoDescTr,
    path: "/",
  });
}

export default async function HomePage() {
  const [settings, services, specialists, publicReviews, fallbackReviews] = await Promise.all([
    getSiteSettings(),
    safeQuery("home services", () => prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 6 }), []),
    safeQuery("home specialists", () => prisma.specialist.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 3 }), []),
    getPublicReviews(3),
    safeQuery(
      "home fallback reviews",
      () =>
        prisma.review.findMany({
          where: { isApproved: true, isVisible: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
      []
    ),
  ]);

  const reviews =
    publicReviews.reviews.length > 0
      ? publicReviews.reviews
      : fallbackReviews.map((review) => ({
          id: review.id,
          patientName: review.patientName,
          ratingStars: review.ratingStars,
          contentTr: review.contentTr,
          contentEn: review.contentEn,
          isApproved: review.isApproved,
          isVisible: review.isVisible,
          createdAt: review.createdAt.toISOString(),
        }));

  const clinicJsonLd = buildClinicJsonLd(settings);
  const resolvedServices = services.map((service) => ({
    ...service,
    imageUrl: resolveServiceImageUrl(service.slug, service.imageUrl),
  }));
  const resolvedSpecialists = specialists.map((specialist) => ({
    ...specialist,
    photoUrl: resolveSpecialistPhotoUrl(specialist.slug, specialist.photoUrl),
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd) }} />
      <HomeClient
        settings={settings}
        services={resolvedServices}
        specialists={resolvedSpecialists}
        reviews={reviews}
      />
    </>
  );
}
