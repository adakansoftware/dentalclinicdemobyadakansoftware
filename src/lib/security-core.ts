const globalStore = globalThis as typeof globalThis & {
  __adakanRateLimitStore?: Map<
    string,
    { attempts: number[]; lastSeen: number; blockedUntil?: number; strikeCount: number }
  >;
  __adakanRateLimitCleanupCounter?: number;
};

const RATE_LIMIT_ENTRY_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX_KEYS = 5000;

const rateLimitStore =
  globalStore.__adakanRateLimitStore ??
  new Map<string, { attempts: number[]; lastSeen: number; blockedUntil?: number; strikeCount: number }>();
globalStore.__adakanRateLimitStore = rateLimitStore;
globalStore.__adakanRateLimitCleanupCounter ??= 0;

export interface RateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
  keySuffix?: string;
}

export interface RateLimitDecision {
  allowed: boolean;
  blocked: boolean;
  retryAfterSec: number;
}

function normalizeRateLimitKeyPart(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 160) || "unknown";
}

function buildRateLimitKey(options: RateLimitOptions, keySuffix: string) {
  const baseKey = normalizeRateLimitKeyPart(keySuffix);
  const contextualKey = options.keySuffix ? normalizeRateLimitKeyPart(options.keySuffix) : "";
  return contextualKey ? `${options.scope}:${baseKey}:${contextualKey}` : `${options.scope}:${baseKey}`;
}

export function buildRequestFingerprintFromHeaders(headerStore: Headers): string {
  const ip = getClientIpFromHeadersSync(headerStore);
  const userAgent = headerStore.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 120)}`;
}

export function buildIpRateLimitKeyFromHeaders(headerStore: Headers): string {
  return getClientIpFromHeadersSync(headerStore);
}

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let withoutPort = trimmed;

  if (trimmed.startsWith("[")) {
    withoutPort = trimmed.replace(/^\[([^\]]+)\](?::\d+)?$/, "$1");
  } else if (/^(?:\d{1,3}\.){3}\d{1,3}:\d+$/.test(trimmed)) {
    withoutPort = trimmed.replace(/:\d+$/, "");
  }

  const candidate = withoutPort.toLowerCase();
  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(candidate);
  const isIpv6 = /^[0-9a-f:]+$/i.test(candidate) && candidate.includes(":");

  if (!isIpv4 && !isIpv6) {
    return null;
  }

  return candidate;
}

export function getClientIpFromHeadersSync(headerStore: Headers): string {
  const directHeaders = [
    headerStore.get("cf-connecting-ip"),
    headerStore.get("x-vercel-forwarded-for"),
    headerStore.get("x-real-ip"),
  ];

  for (const value of directHeaders) {
    const normalized = normalizeIp(value);
    if (normalized) {
      return normalized;
    }
  }

  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  for (const value of forwardedFor.split(",")) {
    const normalized = normalizeIp(value);
    if (normalized) {
      return normalized;
    }
  }

  const forwarded = headerStore.get("forwarded") ?? "";
  const forwardedMatch = forwarded.match(/for=(?:"?\[?)([0-9a-fA-F\.:]+)(?:\]?"?)/);
  const normalizedForwarded = normalizeIp(forwardedMatch?.[1]);
  if (normalizedForwarded) {
    return normalizedForwarded;
  }

  return "unknown";
}

function cleanupRateLimitStore(now: number) {
  globalStore.__adakanRateLimitCleanupCounter = (globalStore.__adakanRateLimitCleanupCounter ?? 0) + 1;

  if (
    globalStore.__adakanRateLimitCleanupCounter % 50 !== 0 &&
    rateLimitStore.size <= RATE_LIMIT_MAX_KEYS
  ) {
    return;
  }

  const staleBefore = now - RATE_LIMIT_ENTRY_TTL_MS;

  for (const [key, entry] of rateLimitStore.entries()) {
    const attempts = entry.attempts.filter((ts) => ts >= staleBefore);

    if (attempts.length === 0 && entry.lastSeen < staleBefore) {
      rateLimitStore.delete(key);
      continue;
    }

    if (attempts.length !== entry.attempts.length) {
      rateLimitStore.set(key, {
        attempts,
        lastSeen: entry.lastSeen,
        blockedUntil: entry.blockedUntil,
        strikeCount: entry.strikeCount,
      });
    }
  }

  if (rateLimitStore.size <= RATE_LIMIT_MAX_KEYS) {
    return;
  }

  const oldestEntries = [...rateLimitStore.entries()]
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen)
    .slice(0, rateLimitStore.size - RATE_LIMIT_MAX_KEYS);

  for (const [key] of oldestEntries) {
    rateLimitStore.delete(key);
  }
}

export function getRateLimitDecisionByKey(options: RateLimitOptions, keySuffix: string): RateLimitDecision {
  const key = buildRateLimitKey(options, keySuffix);
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const entry = rateLimitStore.get(key);
  const blockedUntil = entry?.blockedUntil ?? 0;

  if (blockedUntil > now) {
    const retryAfterSec = Math.max(1, Math.ceil((blockedUntil - now) / 1000));
    rateLimitStore.set(key, {
      attempts: entry?.attempts ?? [],
      lastSeen: now,
      blockedUntil,
      strikeCount: entry?.strikeCount ?? 1,
    });
    cleanupRateLimitStore(now);
    return { allowed: false, blocked: true, retryAfterSec };
  }

  const attempts = (entry?.attempts ?? []).filter((ts) => ts >= windowStart);

  if (attempts.length >= options.limit) {
    const strikeCount = Math.min((entry?.strikeCount ?? 0) + 1, 6);
    const penaltyMs = Math.min(options.windowMs * 2 ** Math.max(0, strikeCount - 1), 30 * 60 * 1000);
    rateLimitStore.set(key, {
      attempts,
      lastSeen: now,
      blockedUntil: now + penaltyMs,
      strikeCount,
    });
    cleanupRateLimitStore(now);
    return {
      allowed: false,
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil(penaltyMs / 1000)),
    };
  }

  attempts.push(now);
  rateLimitStore.set(key, {
    attempts,
    lastSeen: now,
    blockedUntil: undefined,
    strikeCount: attempts.length === 1 ? 0 : entry?.strikeCount ?? 0,
  });
  cleanupRateLimitStore(now);
  return { allowed: true, blocked: false, retryAfterSec: 0 };
}

export function enforceRateLimitByKey(options: RateLimitOptions, keySuffix: string): boolean {
  return getRateLimitDecisionByKey(options, keySuffix).allowed;
}

export function validateHoneypot(formData: FormData, fieldName = "website"): boolean {
  const value = formData.get(fieldName);
  return typeof value !== "string" || value.trim() === "";
}

export function validateFormAge(formData: FormData, fieldName = "formStartedAt", minAgeMs = 1200): boolean {
  const raw = formData.get(fieldName);
  if (typeof raw !== "string") return false;
  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt)) return false;
  return Date.now() - startedAt >= minAgeMs;
}
