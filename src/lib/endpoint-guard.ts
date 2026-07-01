import { buildIpRateLimitKeyFromHeaders, getRateLimitDecisionByKey } from "./security-core.ts";
import { getBearerTokenFromHeaders, secureCompare } from "./api-security.ts";
import { getSuspicionDecision, recordSuspiciousActivity } from "./attack-monitor.ts";

export function getEndpointClientKey(headers: Headers) {
  return buildIpRateLimitKeyFromHeaders(headers);
}

export function getEndpointBlockDecision(headers: Headers) {
  return getSuspicionDecision(getEndpointClientKey(headers));
}

export function applyEndpointSuspicion(headers: Headers, weight: number) {
  return recordSuspiciousActivity(getEndpointClientKey(headers), weight);
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
