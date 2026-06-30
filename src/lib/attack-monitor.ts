const globalStore = globalThis as typeof globalThis & {
  __adakanSuspicionStore?: Map<string, { score: number; lastSeen: number; blockedUntil?: number }>;
};

const SUSPICION_TTL_MS = 6 * 60 * 60 * 1000;
const SUSPICION_MAX_KEYS = 5000;

const suspicionStore =
  globalStore.__adakanSuspicionStore ?? new Map<string, { score: number; lastSeen: number; blockedUntil?: number }>();
globalStore.__adakanSuspicionStore = suspicionStore;

function cleanupSuspicionStore(now: number) {
  const staleBefore = now - SUSPICION_TTL_MS;

  for (const [key, value] of suspicionStore.entries()) {
    if (value.lastSeen < staleBefore && (!value.blockedUntil || value.blockedUntil < now)) {
      suspicionStore.delete(key);
    }
  }

  if (suspicionStore.size <= SUSPICION_MAX_KEYS) {
    return;
  }

  const oldestEntries = [...suspicionStore.entries()]
    .sort((a, b) => a[1].lastSeen - b[1].lastSeen)
    .slice(0, suspicionStore.size - SUSPICION_MAX_KEYS);

  for (const [key] of oldestEntries) {
    suspicionStore.delete(key);
  }
}

export function recordSuspiciousActivity(key: string, weight = 1) {
  const now = Date.now();
  const entry = suspicionStore.get(key);
  const score = Math.min((entry?.score ?? 0) + weight, 20);
  const blockedUntil = score >= 6 ? now + Math.min((score - 5) * 5 * 60 * 1000, 60 * 60 * 1000) : entry?.blockedUntil;

  suspicionStore.set(key, {
    score,
    lastSeen: now,
    blockedUntil,
  });

  cleanupSuspicionStore(now);
  return { score, blockedUntil };
}

export function clearSuspicion(key: string) {
  suspicionStore.delete(key);
}

export function getSuspicionDecision(key: string) {
  const now = Date.now();
  const entry = suspicionStore.get(key);

  if (!entry) {
    return { blocked: false, retryAfterSec: 0, score: 0 };
  }

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000)),
      score: entry.score,
    };
  }

  if (entry.blockedUntil && entry.blockedUntil <= now) {
    suspicionStore.set(key, {
      score: Math.max(0, entry.score - 3),
      lastSeen: now,
      blockedUntil: undefined,
    });
  }

  return { blocked: false, retryAfterSec: 0, score: entry.score };
}

