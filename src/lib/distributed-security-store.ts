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
