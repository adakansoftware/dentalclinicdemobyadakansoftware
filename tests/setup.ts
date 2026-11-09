// The local .env points DATABASE_URL at the shared production Neon database.
// Vitest exposes it to evaluated source modules (observed even after deletion
// from the test-file context), so DB-backed security helpers would run
// against production. Two guards:
// 1. Drop DATABASE_URL from the test-file context.
// 2. Latch the distributed-security-store's own DB backoff flag far into the
//    future — withDistributedSecurityState() then always returns null and
//    every async helper uses its in-memory fallback, the same path the old
//    bare-node runner exercised (it ran without any .env at all).
delete process.env.DATABASE_URL;

const globalStore = globalThis as typeof globalThis & {
  __adakanDistributedSecurityDbDisabledUntil?: number;
};
globalStore.__adakanDistributedSecurityDbDisabledUntil = Number.MAX_SAFE_INTEGER;
