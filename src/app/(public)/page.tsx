import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/public/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, services, specialists, reviews] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 6 }),
    prisma.specialist.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 3 }),
    prisma.review.findMany({ where: { isApproved: true, isVisible: true }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const serializedReviews = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <HomeClient
      settings={settings}
      services={services}
      specialists={specialists}
      reviews={serializedReviews}
    />
  );
}
