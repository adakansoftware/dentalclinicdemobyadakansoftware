import { timingSafeEqual } from "node:crypto";
import { getOptionalEnv } from "./env.ts";

function buildFallbackRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getRequestIdFromHeaders(headers: Headers): string {
  const headerValue = headers.get("x-request-id")?.trim() ?? "";
  return /^[a-zA-Z0-9._:-]{8,120}$/.test(headerValue) ? headerValue : buildFallbackRequestId();
}

export function buildApiHeaders(requestId: string, extra: Record<string, string> = {}) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Request-Id": requestId,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...extra,
  };
}

export function secureCompare(expected: string | undefined, actual: string | null | undefined) {
  if (!expected || !actual) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function getBearerTokenFromHeaders(headers: Headers | { get(name: string): string | null }) {
  const authHeader = headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "").toLowerCase();
}

function tryGetOriginFromUrl(value: string | null) {
  if (!value) return null;

  try {
    return normalizeOrigin(new URL(value).origin);
  } catch {
    return null;
  }
}

export function getAllowedOrigins() {
  const env = getOptionalEnv();
  const origins = new Set<string>();

  const rawOrigins = [
    env.NEXT_PUBLIC_APP_URL,
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXTAUTH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
  ];

  for (const rawOrigin of rawOrigins) {
    const parsed =
      rawOrigin && !rawOrigin.startsWith("http://") && !rawOrigin.startsWith("https://")
        ? tryGetOriginFromUrl(`https://${rawOrigin}`)
        : tryGetOriginFromUrl(rawOrigin ?? null);

    if (parsed) {
      origins.add(parsed);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("https://localhost:3000");
    origins.add("https://127.0.0.1:3000");
  }

  return origins;
}

export function isAllowedBrowserOrigin(
  headers: Headers,
  requestUrl: string,
  options: { requireHeaderInProduction?: boolean } = {}
) {
  const requestOrigin = tryGetOriginFromUrl(requestUrl);
  const originHeader = tryGetOriginFromUrl(headers.get("origin"));
  const refererOrigin = tryGetOriginFromUrl(headers.get("referer"));
  const candidateOrigin = originHeader ?? refererOrigin;

  if (!candidateOrigin) {
    if (options.requireHeaderInProduction && process.env.NODE_ENV === "production") {
      return false;
    }
    return true;
  }

  if (requestOrigin && candidateOrigin === requestOrigin) {
    return true;
  }

  return getAllowedOrigins().has(candidateOrigin);
}
