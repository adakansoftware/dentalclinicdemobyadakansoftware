import { getAllowedOrigins } from "./api-security.ts";

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

export function buildRequestUrlFromHeaders(headers: Headers, pathname = "/") {
  const trustedOrigin = normalizeOrigin(headers.get("origin")) ?? normalizeOrigin(headers.get("referer"));

  if (!trustedOrigin) {
    return null;
  }

  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${trustedOrigin}${safePath}`;
}

export function isTrustedMutationOrigin(headers: Headers, pathname = "/") {
  const secFetchSite = headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return false;
  }

  const trustedRequestUrl = buildRequestUrlFromHeaders(headers, pathname);
  if (!trustedRequestUrl) {
    return false;
  }

  return getAllowedOrigins().has(new URL(trustedRequestUrl).origin.toLowerCase());
}
