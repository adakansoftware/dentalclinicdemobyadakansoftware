import type { Prisma, SecurityState } from "@prisma/client";

type MemorySecurityState = {
  kind: string;
  value: string;
  expiresAt: number;
  updatedAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __adakanDistributedSecurityStore?: Map<string, MemorySecurityState>;
  __adakanDistributedSecurityDbDisabledUntil?: number;
};

const memoryStore = globalStore.__adakanDistributedSecurityStore ?? new Map<string, MemorySecurityState>();
globalStore.__adakanDistributedSecurityStore = memoryStore;
globalStore.__adakanDistributedSecurityDbDisabledUntil ??= 0;

const DB_BACKOFF_MS = 30_000;

export interface DistributedSecurityEntry {
  key: string;
  kind: string;
  value: string;
  expiresAt: Date;
  updatedAt: Date;
}

type LockedSecurityContext = {
  entry: DistributedSecurityEntry | null;
  tx: Prisma.TransactionClient;
};

function toDistributedEntry(entry: SecurityState): DistributedSecurityEntry {
  return {
    key: entry.key,
    kind: entry.kind,
    value: entry.value,
    expiresAt: entry.expiresAt,
    updatedAt: entry.updatedAt,
  };
}

function cleanupMemoryStore(now: number) {
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

function rememberDbFailure() {
  globalStore.__adakanDistributedSecurityDbDisabledUntil = Date.now() + DB_BACKOFF_MS;
}

function shouldSkipDb() {
  return (globalStore.__adakanDistributedSecurityDbDisabledUntil ?? 0) > Date.now();
}

async function getPrismaClient() {
  const mod = await import("@/lib/prisma");
  return mod.prisma;
}

export function withMemorySecurityState<T>(
  key: string,
  kind: string,
  fn: (entry: MemorySecurityState | null, persist: (value: string, expiresAtMs: number) => void, drop: () => void) => T
): T {
  const now = Date.now();
  cleanupMemoryStore(now);
  const entry = memoryStore.get(key);
  const activeEntry = entry && entry.kind === kind && entry.expiresAt > now ? entry : null;

  return fn(
    activeEntry,
    (value, expiresAtMs) => {
      memoryStore.set(key, {
        kind,
        value,
        expiresAt: expiresAtMs,
        updatedAt: Date.now(),
      });
    },
    () => {
      memoryStore.delete(key);
    }
  );
}

export async function withDistributedSecurityState<T>(
  key: string,
  kind: string,
  fn: (context: LockedSecurityContext) => Promise<T>
): Promise<T | null> {
  if (shouldSkipDb()) {
    return null;
  }

  try {
    const prisma = await getPrismaClient();

    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`security-state:${key}`}))`;

      const rawEntry = await tx.securityState.findUnique({
        where: { key },
      });

      const entry =
        rawEntry && rawEntry.kind === kind
          ? toDistributedEntry(rawEntry)
          : rawEntry && rawEntry.expiresAt.getTime() <= Date.now()
            ? toDistributedEntry(rawEntry)
            : null;

      const result = await fn({ entry, tx });

      if (Math.random() < 0.02) {
        await tx.securityState.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(Date.now() - 60_000),
            },
          },
        });
      }

      return result;
    });
  } catch {
    rememberDbFailure();
    return null;
  }
}

export async function claimDistributedLease(
  key: string,
  leaseMs: number,
  owner: string,
  kind = "lease"
): Promise<{ claimed: boolean; expiresAt: number; owner: string | null }> {
  const now = Date.now();
  const result = await withDistributedSecurityState(`lease:${key}`, kind, async ({ entry, tx }) => {
    const current =
      entry && entry.expiresAt.getTime() > now
        ? (JSON.parse(entry.value) as { owner?: string })
        : null;

    if (entry && entry.expiresAt.getTime() > now && current?.owner && current.owner !== owner) {
      return {
        claimed: false,
        expiresAt: entry.expiresAt.getTime(),
        owner: current.owner,
      };
    }

    const expiresAt = new Date(now + leaseMs);
    await tx.securityState.upsert({
      where: { key: `lease:${key}` },
      create: {
        key: `lease:${key}`,
        kind,
        value: JSON.stringify({ owner }),
        expiresAt,
      },
      update: {
        kind,
        value: JSON.stringify({ owner }),
        expiresAt,
      },
    });

    return {
      claimed: true,
      expiresAt: expiresAt.getTime(),
      owner,
    };
  });

  if (result) {
    return result;
  }

  return {
    claimed: true,
    expiresAt: now + leaseMs,
    owner,
  };
}

export async function releaseDistributedLease(key: string, owner: string, kind = "lease") {
  await withDistributedSecurityState(`lease:${key}`, kind, async ({ entry, tx }) => {
    if (!entry) {
      return false;
    }

    const current = JSON.parse(entry.value) as { owner?: string };
    if (current.owner !== owner) {
      return false;
    }

    await tx.securityState.deleteMany({
      where: {
        key: `lease:${key}`,
        kind,
      },
    });

    return true;
  });
}
