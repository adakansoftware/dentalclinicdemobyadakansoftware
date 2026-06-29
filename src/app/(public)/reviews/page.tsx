import type { Metadata } from "next";
import ReviewsClient from "@/components/public/ReviewsClient";
import { getPublicReviews } from "@/lib/google-reviews";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return await buildPublicPageMetadata({
    settings,
    title: `Hasta Yorumları | ${settings.clinicName}`,
    description: `${settings.clinicName} için onaylı hasta yorumlarını inceleyin.`,
    path: "/reviews",
  });
}

export default async function ReviewsPage() {
  const publicReviews = await getPublicReviews(9);
  if (publicReviews.reviews.length > 0) {
    return <ReviewsClient data={publicReviews} />;
  }

  const rows = await safeQuery(
    "reviews fallback list",
    () =>
      prisma.review.findMany({
        where: { isApproved: true, isVisible: true },
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  return (
    <ReviewsClient
      data={{
        source: "internal",
        reviews: rows.map((review) => ({
          id: review.id,
          patientName: review.patientName,
          ratingStars: review.ratingStars,
          contentTr: review.contentTr,
          contentEn: review.contentEn,
          isApproved: review.isApproved,
          isVisible: review.isVisible,
          createdAt: review.createdAt.toISOString(),
        })),
      }}
    />
  );
}
