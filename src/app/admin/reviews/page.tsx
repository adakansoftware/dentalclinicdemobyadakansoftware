import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminReviewsClient from "@/components/admin/AdminReviewsClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireAdmin();
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <AdminReviewsClient
      reviews={reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))}
    />
  );
}
