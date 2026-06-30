import test from "node:test";
import assert from "node:assert/strict";
import {
  buildApiHeaders,
  getBearerTokenFromHeaders,
  getAllowedOrigins,
  getRequestIdFromHeaders,
  isAllowedBrowserOrigin,
  secureCompare,
} from "../src/lib/api-security.ts";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH, TWITTER_IMAGE_PATH } from "../src/lib/social-preview.ts";
import { toAbsoluteAssetUrl } from "../src/lib/seo.ts";
import {
  buildRequestFingerprintFromHeaders,
  enforceRateLimitByKey,
  getClientIpFromHeadersSync,
  validateFormAge,
  validateHoneypot,
} from "../src/lib/security-core.ts";
import { isAllowedAbsoluteAssetUrl, isAllowedLocalAssetPath, isValidAssetInput } from "../src/lib/upload-assets.ts";

function setEnvValue(key: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;

  if (value === undefined) {
    delete env[key];
    return;
  }

  env[key] = value;
}

test("getClientIpFromHeadersSync prefers forwarded headers", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
  });

  assert.equal(getClientIpFromHeadersSync(headers), "203.0.113.10");
});

test("getClientIpFromHeadersSync prefers provider headers and strips ports", () => {
  const headers = new Headers({
    "cf-connecting-ip": "198.51.100.9",
    "x-forwarded-for": "203.0.113.10:443, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  });

  assert.equal(getClientIpFromHeadersSync(headers), "198.51.100.9");
});

test("getClientIpFromHeadersSync falls back to forwarded header syntax", () => {
  const headers = new Headers({
    forwarded: 'for="[2001:db8::1]:1234";proto=https',
  });

  assert.equal(getClientIpFromHeadersSync(headers), "2001:db8::1");
});

test("buildRequestFingerprintFromHeaders includes IP and user agent", () => {
  const headers = new Headers({
    "x-real-ip": "198.51.100.1",
    "user-agent": "SmokeTestAgent/1.0",
  });

  assert.equal(buildRequestFingerprintFromHeaders(headers), "198.51.100.1:SmokeTestAgent/1.0");
});

test("getRequestIdFromHeaders returns sanitized header when present", () => {
  const headers = new Headers({
    "x-request-id": "req-demo-12345",
  });

  assert.equal(getRequestIdFromHeaders(headers), "req-demo-12345");
});

test("buildApiHeaders always includes hardened defaults", () => {
  const headers = buildApiHeaders("req-demo-12345", { Vary: "Origin" });
  const headerMap = headers as Record<string, string>;

  assert.equal(headers["Cache-Control"], "no-store");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Robots-Tag"], "noindex, nofollow");
  assert.equal(headers["X-Request-Id"], "req-demo-12345");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headerMap["Vary"], "Origin");
});

test("isAllowedBrowserOrigin accepts same-origin requests", () => {
  const headers = new Headers({
    origin: "https://example.com",
  });

  assert.equal(isAllowedBrowserOrigin(headers, "https://example.com/api/slots"), true);
});

test("isAllowedBrowserOrigin rejects unrelated origins", () => {
  const headers = new Headers({
    origin: "https://evil.example",
  });

  assert.equal(isAllowedBrowserOrigin(headers, "https://example.com/api/slots"), false);
});

test("isAllowedBrowserOrigin rejects missing headers in production when required", () => {
  const previousEnv = process.env.NODE_ENV;
  setEnvValue("NODE_ENV", "production");

  try {
    const headers = new Headers();
    assert.equal(isAllowedBrowserOrigin(headers, "https://example.com/api/slots", { requireHeaderInProduction: true }), false);
  } finally {
    setEnvValue("NODE_ENV", previousEnv);
  }
});

test("getAllowedOrigins normalizes Vercel production hostnames", () => {
  const previousValue = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  process.env.VERCEL_PROJECT_PRODUCTION_URL = "dental-demo-by-adakan-cx97.vercel.app";

  try {
    const origins = getAllowedOrigins();
    assert.equal(origins.has("https://dental-demo-by-adakan-cx97.vercel.app"), true);
  } finally {
    if (previousValue === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = previousValue;
    }
  }
});

test("secureCompare matches only exact secrets", () => {
  assert.equal(secureCompare("secret-value", "secret-value"), true);
  assert.equal(secureCompare("secret-value", "secret-value-2"), false);
  assert.equal(secureCompare("secret-value", null), false);
});

test("getBearerTokenFromHeaders extracts bearer token", () => {
  const headers = new Headers({
    authorization: "Bearer secret-value",
  });

  assert.equal(getBearerTokenFromHeaders(headers), "secret-value");
});

test("asset validators accept only safe local asset references", () => {
  assert.equal(isAllowedLocalAssetPath("/images/hero.jpg"), true);
  assert.equal(isAllowedLocalAssetPath("/uploads/services/demo.jpg"), true);
  assert.equal(isAllowedLocalAssetPath("/opengraph-image.png"), true);
  assert.equal(isAllowedLocalAssetPath("/twitter-image.png"), true);
  assert.equal(isAllowedLocalAssetPath("/admin/secret.txt"), false);
  assert.equal(isValidAssetInput("https://evil.example/logo.png"), false);
});

test("asset validators accept same-site absolute asset urls only", () => {
  const previousUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://clinic.example";

  try {
    assert.equal(isAllowedAbsoluteAssetUrl("https://clinic.example/images/hero.jpg"), true);
    assert.equal(isAllowedAbsoluteAssetUrl("https://clinic.example/uploads/branding/logo.png"), true);
    assert.equal(isAllowedAbsoluteAssetUrl("https://clinic.example/private/logo.png"), false);
    assert.equal(isAllowedAbsoluteAssetUrl("https://cdn.example/logo.png"), false);
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousUrl;
    }
  }
});

test("social metadata asset helpers keep canonical preview dimensions", () => {
  assert.equal(SOCIAL_IMAGE_PATH, "/images/hero.jpg");
  assert.equal(TWITTER_IMAGE_PATH, "/images/hero.jpg");
  assert.equal(SOCIAL_IMAGE_WIDTH, 1344);
  assert.equal(SOCIAL_IMAGE_HEIGHT, 768);
});

test("toAbsoluteAssetUrl normalizes local social asset urls to canonical origin", () => {
  const previousUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://clinic.example";

  try {
    assert.equal(toAbsoluteAssetUrl("/images/hero.jpg"), "https://clinic.example/images/hero.jpg");
    assert.equal(toAbsoluteAssetUrl("https://evil.example/og.png"), undefined);
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousUrl;
    }
  }
});

test("validateHoneypot rejects filled bot field", () => {
  const formData = new FormData();
  formData.set("website", "spam");
  assert.equal(validateHoneypot(formData), false);
});

test("validateFormAge accepts sufficiently old forms", () => {
  const formData = new FormData();
  formData.set("formStartedAt", String(Date.now() - 2000));
  assert.equal(validateFormAge(formData), true);
});

test("enforceRateLimitByKey blocks after limit", () => {
  const scope = `unit-test-${Date.now()}`;
  const options = { scope, limit: 2, windowMs: 60_000 };

  assert.equal(enforceRateLimitByKey(options, "same-user"), true);
  assert.equal(enforceRateLimitByKey(options, "same-user"), true);
  assert.equal(enforceRateLimitByKey(options, "same-user"), false);
});
