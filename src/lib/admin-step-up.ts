import { createHash } from "crypto";

const ADMIN_STEP_UP_TTL_SEC = 10 * 60;
const ADMIN_STEP_UP_FALLBACK_SECRET = "missing-admin-step-up-secret";

function getStepUpSecret(secret = process.env.SESSION_SECRET) {
  return secret ?? ADMIN_STEP_UP_FALLBACK_SECRET;
}

export function createAdminStepUpProof(adminId: string, issuedAtSec: number, secret = process.env.SESSION_SECRET) {
  const signature = createHash("sha256")
    .update(`${getStepUpSecret(secret)}:${adminId}:${issuedAtSec}`)
    .digest("hex");

  return `${issuedAtSec}.${signature}`;
}

export function verifyAdminStepUpProof(
  adminId: string,
  value: string | null | undefined,
  nowMs = Date.now(),
  secret = process.env.SESSION_SECRET
) {
  if (!value) {
    return false;
  }

  const [issuedAtRaw, signature] = value.split(".");
  const issuedAtSec = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAtSec) || !signature) {
    return false;
  }

  const ageSec = Math.floor(nowMs / 1000) - issuedAtSec;
  if (ageSec < 0 || ageSec > ADMIN_STEP_UP_TTL_SEC) {
    return false;
  }

  return createAdminStepUpProof(adminId, issuedAtSec, secret) === value;
}

export function getAdminStepUpTtlSec() {
  return ADMIN_STEP_UP_TTL_SEC;
}
