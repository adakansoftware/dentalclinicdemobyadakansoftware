import { buildIpRateLimitKeyFromHeaders, getRateLimitDecisionByKey, getRateLimitDecisionByKeyAsync } from "./security-core.ts";
import { getBearerTokenFromHeaders, secureCompare } from "./api-security.ts";
import { getSuspicionDecision, getSuspicionDecisionAsync, recordSuspiciousActivity, recordSuspiciousActivityAsync } from "./attack-monitor.ts";

export function getEndpointClientKey(headers: Headers) {
  return buildIpRateLimitKeyFromHeaders(headers);
}

export function getEndpointBlockDecision(headers: Headers) {
  return getSuspicionDecision(getEndpointClientKey(headers));
}

export async function getEndpointBlockDecisionAsync(headers: Headers) {
  return getSuspicionDecisionAsync(getEndpointClientKey(headers));
}

export function applyEndpointSuspicion(headers: Headers, weight: number) {
  return recordSuspiciousActivity(getEndpointClientKey(headers), weight);
}

export async function applyEndpointSuspicionAsync(headers: Headers, weight: number) {
  return recordSuspiciousActivityAsync(getEndpointClientKey(headers), weight);
}

export function authorizeBearerSecret(headers: Headers, secret: string | undefined) {
  const bearerToken = getBearerTokenFromHeaders(headers);
  return secureCompare(secret, bearerToken);
}

export function checkEndpointRateLimit(
  headers: Headers,
  options: { scope: string; limit: number; windowMs: number; keySuffix?: string }
) {
  return getRateLimitDecisionByKey(options, getEndpointClientKey(headers));
}

export async function checkEndpointRateLimitAsync(
  headers: Headers,
  options: { scope: string; limit: number; windowMs: number; keySuffix?: string }
) {
  return getRateLimitDecisionByKeyAsync(options, getEndpointClientKey(headers));
}
