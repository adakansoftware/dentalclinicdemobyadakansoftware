import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { resolveServiceImageUrl } from "@/lib/image-fallbacks";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export { default } from "../../../services/[slug]/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [settings, row] = await Promise.all([
    getSiteSettings(),
    safeQuery(
      `service metadata en ${slug}`,
      () =>
        prisma.service.findFirst({
          where: { slug, isActive: true },
          select: {
            nameEn: true,
            shortDescEn: true,
            imageUrl: true,
          },
        }),
      null
    ),
  ]);

  if (!row) {
    return await buildPublicPageMetadata({
      settings,
      title: `Treatment Not Found | ${settings.clinicNameEn}`,
      description: settings.seoDescEn,
      path: `/en/services/${slug}`,
      locale: "en",
    });
  }

  return await buildPublicPageMetadata({
    settings,
    title: `${row.nameEn} | ${settings.clinicNameEn}`,
    description: row.shortDescEn,
    path: `/en/services/${slug}`,
    imageUrl: resolveServiceImageUrl(slug, row.imageUrl),
    locale: "en",
  });
}
