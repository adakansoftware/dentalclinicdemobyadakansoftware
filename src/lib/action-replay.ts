import { createHash } from "crypto";

const globalStore = globalThis as typeof globalThis & {
  __adakanActionReplayStore?: Map<string, { expiresAt: number; hits: number }>;
};

const replayStore = globalStore.__adakanActionReplayStore ?? new Map<string, { expiresAt: number; hits: number }>();
globalStore.__adakanActionReplayStore = replayStore;

function cleanupReplayStore(now: number) {
  for (const [key, entry] of replayStore.entries()) {
    if (entry.expiresAt <= now) {
      replayStore.delete(key);
    }
  }
}

export function buildActionReplayKey(scope: string, values: Array<string | number | boolean | null | undefined>) {
  const normalized = values.map((value) => String(value ?? "").trim()).join("|");
  const digest = createHash("sha256").update(`${scope}:${normalized}`).digest("hex");
  return `${scope}:${digest}`;
}

export function claimActionReplay(key: string, ttlMs: number) {
  const now = Date.now();
  cleanupReplayStore(now);
  const existing = replayStore.get(key);

  if (existing && existing.expiresAt > now) {
    replayStore.set(key, {
      expiresAt: existing.expiresAt,
      hits: existing.hits + 1,
    });
    return { duplicate: true, hits: existing.hits + 1 };
  }

  replayStore.set(key, {
    expiresAt: now + ttlMs,
    hits: 1,
  });

  return { duplicate: false, hits: 1 };
}

export async function claimActionReplayAsync(key: string, ttlMs: number) {
  const storageKey = `replay:${key}`;
  const now = Date.now();
  const { withDistributedSecurityState } = await import("./distributed-security-store.ts");
  const dbResult = await withDistributedSecurityState(storageKey, "replay", async ({ entry, tx }) => {
    if (entry && entry.expiresAt.getTime() > now) {
      const currentState = JSON.parse(entry.value) as { hits?: number };
      const hits = (currentState.hits ?? 1) + 1;
      await tx.securityState.update({
        where: { key: storageKey },
        data: {
          value: JSON.stringify({ hits }),
          expiresAt: entry.expiresAt,
        },
      });
      return { duplicate: true, hits };
    }

    const expiresAt = new Date(now + ttlMs);
    await tx.securityState.upsert({
      where: { key: storageKey },
      create: {
        key: storageKey,
        kind: "replay",
        value: JSON.stringify({ hits: 1 }),
        expiresAt,
      },
      update: {
        kind: "replay",
        value: JSON.stringify({ hits: 1 }),
        expiresAt,
      },
    });
    return { duplicate: false, hits: 1 };
  });

  if (dbResult) {
    return dbResult;
  }

  return claimActionReplay(key, ttlMs);
}
