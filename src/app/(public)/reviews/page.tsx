import { prisma } from "@/lib/prisma";
import ReviewsClient from "@/components/public/ReviewsClient";
import type { ReviewData } from "@/types";

export const revalidate = 30;

export default async function ReviewsPage() {
  const rows = await prisma.review.findMany({
    where: { isApproved: true, isVisible: true },
    orderBy: { createdAt: "desc" },
  });
  const reviews: ReviewData[] = rows.map((r) => ({
    id: r.id, patientName: r.patientName, ratingStars: r.ratingStars,
    contentTr: r.contentTr, contentEn: r.contentEn,
    isApproved: r.isApproved, isVisible: r.isVisible,
    createdAt: r.createdAt.toISOString(),
  }));
  return <ReviewsClient reviews={reviews} />;
}
