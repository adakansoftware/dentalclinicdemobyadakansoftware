import { headers } from "next/headers";
import {
  buildRequestFingerprintFromHeaders,
  enforceRateLimitByKey,
  enforceRateLimitByKeyAsync,
  getRateLimitDecisionByKey,
  getRateLimitDecisionByKeyAsync,
  getClientIpFromHeadersSync,
  type RateLimitOptions,
  validateFormAge,
  validateHoneypot,
} from "./security-core";

export {
  buildRequestFingerprintFromHeaders,
  buildIpRateLimitKeyFromHeaders,
  enforceRateLimitByKey,
  enforceRateLimitByKeyAsync,
  getRateLimitDecisionByKey,
  getRateLimitDecisionByKeyAsync,
  getClientIpFromHeadersSync,
  validateFormAge,
  validateHoneypot,
} from "./security-core";

export async function getRequestFingerprint(): Promise<string> {
  const headerStore = await headers();
  return buildRequestFingerprintFromHeaders(headerStore);
}

export async function getClientIpRateLimitKey(): Promise<string> {
  const headerStore = await headers();
  return getClientIpFromHeadersSync(headerStore);
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<boolean> {
  const fingerprint = await getRequestFingerprint();
  return enforceRateLimitByKeyAsync(options, fingerprint);
}
