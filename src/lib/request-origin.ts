import { isAllowedBrowserOrigin } from "./api-security.ts";

function normalizeHost(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return /^[a-z0-9.-]+(?::\d+)?$/.test(trimmed) ? trimmed : null;
}

function normalizeProto(value: string | null) {
  if (value === "http" || value === "https") {
    return value;
  }

  return null;
}

export function buildRequestUrlFromHeaders(headers: Headers, pathname = "/") {
  const host =
    normalizeHost(headers.get("x-forwarded-host")) ??
    normalizeHost(headers.get("host")) ??
    normalizeHost(headers.get("x-original-host"));

  if (!host) {
    return null;
  }

  const proto =
    normalizeProto(headers.get("x-forwarded-proto")) ??
    normalizeProto(headers.get("x-forwarded-protocol")) ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${proto}://${host}${safePath}`;
}

export function isTrustedMutationOrigin(headers: Headers, pathname = "/") {
  const requestUrl = buildRequestUrlFromHeaders(headers, pathname);
  if (!requestUrl) {
    return false;
  }

  const secFetchSite = headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite && !["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return false;
  }

  return isAllowedBrowserOrigin(headers, requestUrl, { requireHeaderInProduction: true });
}
