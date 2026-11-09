import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 60;

export { default, generateStaticParams } from "../../../specialists/[slug]/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [settings, row] = await Promise.all([
    getSiteSettings(),
    safeQuery(
      `specialist metadata en ${slug}`,
      () =>
        prisma.specialist.findFirst({
          where: { slug, isActive: true },
          select: {
            nameEn: true,
            titleEn: true,
          },
        }),
      null
    ),
  ]);

  if (!row) {
    return await buildPublicPageMetadata({
      settings,
      title: `Specialist Not Found | ${settings.clinicNameEn}`,
      description: settings.seoDescEn,
      path: `/en/specialists/${slug}`,
      locale: "en",
    });
  }

  return await buildPublicPageMetadata({
    settings,
    title: `${row.nameEn} | ${settings.clinicNameEn}`,
    description: row.titleEn,
    path: `/en/specialists/${slug}`,
    locale: "en",
  });
}
