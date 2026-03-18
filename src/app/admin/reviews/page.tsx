import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";
import type { ReviewData } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireAdmin();
  const rows = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  const reviews: ReviewData[] = rows.map((r) => ({
    id: r.id, patientName: r.patientName, ratingStars: r.ratingStars,
    contentTr: r.contentTr, contentEn: r.contentEn,
    isApproved: r.isApproved, isVisible: r.isVisible,
    createdAt: r.createdAt.toISOString(),
  }));
  return <AdminReviewsClient reviews={reviews} />;
}
