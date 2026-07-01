import { createHash } from "crypto";

const SESSION_GUARD_FALLBACK_SECRET = "missing-session-secret";
const SESSION_ROTATE_AFTER_MS = 24 * 60 * 60 * 1000;

function normalizeHeaderValue(value: string | null, fallback = "unknown") {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 160) : fallback;
}

export function buildAdminSessionClientBinding(headers: Headers) {
  return [
    normalizeHeaderValue(headers.get("user-agent")),
    normalizeHeaderValue(headers.get("accept-language")),
  ].join("|");
}

export function hashAdminSessionGuard(token: string, clientBinding: string, secret = process.env.SESSION_SECRET) {
  return createHash("sha256")
    .update(`${secret ?? SESSION_GUARD_FALLBACK_SECRET}:${token}:${clientBinding}`)
    .digest("hex");
}

export function shouldInvalidateAdminSessionGuard(
  token: string,
  clientBinding: string,
  storedGuard: string | null | undefined,
  secret = process.env.SESSION_SECRET
) {
  if (!storedGuard) {
    return true;
  }

  return storedGuard !== hashAdminSessionGuard(token, clientBinding, secret);
}

export function shouldRotateAdminSession(createdAt: Date, now = Date.now()) {
  return now - createdAt.getTime() >= SESSION_ROTATE_AFTER_MS;
}
