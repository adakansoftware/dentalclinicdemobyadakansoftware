import type { MetadataRoute } from "next";
import { absoluteUrl, getRequestBaseUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getRequestBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml", baseUrl),
    host: absoluteUrl("/", baseUrl),
  };
}
