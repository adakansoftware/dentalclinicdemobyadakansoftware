import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildIpRateLimitKeyFromHeaders, getRateLimitDecisionByKey } from "@/lib/security";
import { getSuspicionDecision, recordSuspiciousActivity } from "@/lib/attack-monitor";

function buildRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isPrivateOrLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function buildCsp(request: NextRequest) {
  const isLocalRequest = isPrivateOrLocalHostname(request.nextUrl.hostname);
  const isSecureRequest = request.nextUrl.protocol === "https:";
  const connectSources =
    isLocalRequest || !isSecureRequest
      ? "'self' http: https: ws: wss:"
      : "'self' https: wss:";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    isLocalRequest ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
    `connect-src ${connectSources}`,
    "frame-src 'self' https://www.google.com https://www.google.com.tr",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ];

  if (!isLocalRequest && isSecureRequest) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

function getRateLimitPolicy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/cron/reminders")) {
    return { scope: "mw-cron", limit: 12, windowMs: 60 * 1000 };
  }

  if (pathname.startsWith("/api/slots")) {
    return { scope: "mw-slots", limit: 30, windowMs: 60 * 1000 };
  }

  if (pathname.startsWith("/api/")) {
    return { scope: "mw-api", limit: 60, windowMs: 60 * 1000 };
  }

  if (pathname.startsWith("/admin/login")) {
    return { scope: "mw-admin-login", limit: 20, windowMs: 10 * 60 * 1000 };
  }

  if (pathname.startsWith("/admin")) {
    return { scope: "mw-admin", limit: 120, windowMs: 60 * 1000 };
  }

  if (
    pathname.startsWith("/appointment") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/reviews")
  ) {
    return { scope: "mw-sensitive-page", limit: 45, windowMs: 60 * 1000 };
  }

  return { scope: "mw-page", limit: 180, windowMs: 60 * 1000 };
}

function isSensitiveRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/appointment") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/reviews")
  );
}

export function middleware(request: NextRequest) {
  const clientKey = buildIpRateLimitKeyFromHeaders(request.headers);

  const suspicionDecision = getSuspicionDecision(clientKey);
  if (suspicionDecision.blocked) {
    return NextResponse.json(
      { error: "Temporarily blocked" },
      {
        status: 429,
        headers: {
          "Retry-After": String(suspicionDecision.retryAfterSec),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (request.method === "TRACE" || request.method === "TRACK") {
    recordSuspiciousActivity(clientKey, 3);
    return new NextResponse(null, { status: 405 });
  }

  if (request.url.length > 2048 || request.nextUrl.pathname.length > 256 || request.nextUrl.search.length > 1024) {
    recordSuspiciousActivity(clientKey, 2);
    return NextResponse.json({ error: "Request too large" }, { status: 414 });
  }

  const isStaticAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/images") ||
    request.nextUrl.pathname === "/favicon.ico" ||
    request.nextUrl.pathname.startsWith("/robots.txt") ||
    request.nextUrl.pathname.startsWith("/sitemap.xml");

  const requestId = request.headers.get("x-request-id")?.trim() || buildRequestId();
  const userAgent = request.headers.get("user-agent")?.trim() ?? "";

  if (isSensitiveRequest(request) && userAgent.length < 8) {
    recordSuspiciousActivity(clientKey, 2);
    return NextResponse.json(
      { error: "Suspicious request rejected" },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": requestId,
        },
      }
    );
  }

  if (!isStaticAsset) {
    const policy = getRateLimitPolicy(request);
    const decision = getRateLimitDecisionByKey(policy, clientKey);

    if (!decision.allowed) {
      recordSuspiciousActivity(clientKey, 1);
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(decision.retryAfterSec || 60),
            "Cache-Control": "no-store",
            "X-Request-Id": requestId,
          },
        }
      );
    }
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });
  response.headers.set("X-Request-Id", requestId);

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "Origin, x-request-id");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Origin-Agent-Cluster", "?1");

  if (request.nextUrl.protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  if (!isStaticAsset) {
    response.headers.set("Content-Security-Policy", buildCsp(request));
  }

  if (!isStaticAsset && isSensitiveRequest(request)) {
    response.headers.set("X-App-Shield", "active");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
