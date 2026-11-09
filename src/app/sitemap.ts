import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { absoluteUrl, getRequestBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getRequestBaseUrl();
  const [services, specialists] = await Promise.all([
    safeQuery(
      "sitemap services",
      () => prisma.service.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      []
    ),
    safeQuery(
      "sitemap specialists",
      () => prisma.specialist.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      []
    ),
  ]);

  const staticPaths = [
    "",
    "/about",
    "/appointment",
    "/contact",
    "/faq",
    "/reviews",
    "/services",
    "/specialists",
  ];

  const withAlternates = (path: string, lastModified: Date): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path || "/", baseUrl),
    lastModified,
    alternates: {
      languages: {
        tr: absoluteUrl(path || "/", baseUrl),
        en: absoluteUrl(path === "" ? "/en" : `/en${path}`, baseUrl),
      },
    },
  });

  const staticPages: MetadataRoute.Sitemap = staticPaths.map((path) => withAlternates(path, new Date()));

  const servicePages: MetadataRoute.Sitemap = services.map((service) =>
    withAlternates(`/services/${service.slug}`, service.updatedAt)
  );

  const specialistPages: MetadataRoute.Sitemap = specialists.map((specialist) =>
    withAlternates(`/specialists/${specialist.slug}`, specialist.updatedAt)
  );

  return [...staticPages, ...servicePages, ...specialistPages];
}
