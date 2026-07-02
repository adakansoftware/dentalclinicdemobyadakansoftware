import { getClientIpFromHeadersSync } from "./security-core.ts";

function parseIpv4(value: string): Uint8Array | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const bytes = parts.map((part) => Number(part));
  if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
    return null;
  }

  return Uint8Array.from(bytes);
}

function expandIpv6(value: string): string[] | null {
  const lower = value.toLowerCase();
  if (!/^[0-9a-f:]+$/.test(lower) || !lower.includes(":")) {
    return null;
  }

  const [headRaw, tailRaw] = lower.split("::");
  if (lower.split("::").length > 2) {
    return null;
  }

  const head = headRaw ? headRaw.split(":").filter(Boolean) : [];
  const tail = tailRaw ? tailRaw.split(":").filter(Boolean) : [];
  const missing = 8 - (head.length + tail.length);

  if (missing < 0) {
    return null;
  }

  if (!head.every((part) => /^[0-9a-f]{1,4}$/.test(part)) || !tail.every((part) => /^[0-9a-f]{1,4}$/.test(part))) {
    return null;
  }

  return [...head, ...Array.from({ length: missing }, () => "0"), ...tail].map((part) => part.padStart(4, "0"));
}

function parseIpv6(value: string): Uint8Array | null {
  const groups = expandIpv6(value);
  if (!groups || groups.length !== 8) {
    return null;
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < groups.length; i += 1) {
    const group = Number.parseInt(groups[i], 16);
    bytes[i * 2] = (group >> 8) & 0xff;
    bytes[i * 2 + 1] = group & 0xff;
  }

  return bytes;
}

function parseIpBytes(value: string): Uint8Array | null {
  return parseIpv4(value) ?? parseIpv6(value);
}

function comparePrefix(candidate: Uint8Array, network: Uint8Array, prefixLength: number) {
  const fullBytes = Math.floor(prefixLength / 8);
  const extraBits = prefixLength % 8;

  for (let i = 0; i < fullBytes; i += 1) {
    if (candidate[i] !== network[i]) {
      return false;
    }
  }

  if (extraBits === 0) {
    return true;
  }

  const mask = 0xff << (8 - extraBits);
  return (candidate[fullBytes] & mask) === (network[fullBytes] & mask);
}

export function parseIpAllowlist(raw: string | null | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(/[,\n]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function isIpAllowedByPolicy(ip: string, allowlist: string[] | string | null | undefined): boolean {
  const entries = Array.isArray(allowlist) ? allowlist : parseIpAllowlist(allowlist);
  if (entries.length === 0) {
    return true;
  }

  const normalizedIp = ip.trim().toLowerCase();
  const candidate = parseIpBytes(normalizedIp);
  if (!candidate) {
    return false;
  }

  return entries.some((entry) => {
    if (!entry.includes("/")) {
      return normalizedIp === entry;
    }

    const [networkRaw, prefixRaw] = entry.split("/", 2);
    const network = parseIpBytes(networkRaw);
    const prefixLength = Number(prefixRaw);

    if (!network || !Number.isInteger(prefixLength)) {
      return false;
    }

    if (network.length !== candidate.length) {
      return false;
    }

    const maxPrefix = network.length * 8;
    if (prefixLength < 0 || prefixLength > maxPrefix) {
      return false;
    }

    return comparePrefix(candidate, network, prefixLength);
  });
}

export function isRequestIpAllowed(headers: Headers, allowlist: string[] | string | null | undefined): boolean {
  const clientIp = getClientIpFromHeadersSync(headers);
  return isIpAllowedByPolicy(clientIp, allowlist);
}
