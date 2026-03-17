import { prisma } from "@/lib/prisma";
import ReviewsClient from "@/components/public/ReviewsClient";

export const revalidate = 30;

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { isApproved: true, isVisible: true },
    orderBy: { createdAt: "desc" },
  });
  return <ReviewsClient reviews={reviews} />;
}
