const globalStore = globalThis as typeof globalThis & {
  __adakanConcurrencyStore?: Map<string, number>;
  __adakanCircuitStore?: Map<string, { failures: number; openedAt?: number; halfOpenInFlight: number }>;
};

const concurrencyStore = globalStore.__adakanConcurrencyStore ?? new Map<string, number>();
const circuitStore =
  globalStore.__adakanCircuitStore ?? new Map<string, { failures: number; openedAt?: number; halfOpenInFlight: number }>();

globalStore.__adakanConcurrencyStore = concurrencyStore;
globalStore.__adakanCircuitStore = circuitStore;

export class ResilienceError extends Error {
  code: "CONCURRENCY_LIMIT" | "CIRCUIT_OPEN" | "TIMEOUT";

  constructor(code: "CONCURRENCY_LIMIT" | "CIRCUIT_OPEN" | "TIMEOUT", message?: string) {
    super(message ?? code);
    this.name = "ResilienceError";
    this.code = code;
  }
}

export async function runWithTimeout<T>(timeoutMs: number, fn: () => Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new ResilienceError("TIMEOUT", "Operation timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function runWithConcurrencyLimit<T>(scope: string, limit: number, fn: () => Promise<T>): Promise<T> {
  const current = concurrencyStore.get(scope) ?? 0;
  if (current >= limit) {
    throw new ResilienceError("CONCURRENCY_LIMIT", `Concurrency limit reached for ${scope}`);
  }

  concurrencyStore.set(scope, current + 1);

  try {
    return await fn();
  } finally {
    const next = Math.max(0, (concurrencyStore.get(scope) ?? 1) - 1);
    if (next === 0) {
      concurrencyStore.delete(scope);
    } else {
      concurrencyStore.set(scope, next);
    }
  }
}

export async function runWithCircuitBreaker<T>(
  scope: string,
  options: { failureThreshold: number; cooldownMs: number; halfOpenMaxConcurrent?: number },
  fn: () => Promise<T>
): Promise<T> {
  const state = circuitStore.get(scope) ?? { failures: 0, openedAt: undefined, halfOpenInFlight: 0 };
  const now = Date.now();
  const halfOpenLimit = options.halfOpenMaxConcurrent ?? 1;

  if (state.openedAt && now - state.openedAt < options.cooldownMs) {
    throw new ResilienceError("CIRCUIT_OPEN", `Circuit is open for ${scope}`);
  }

  const isHalfOpen = Boolean(state.openedAt && now - state.openedAt >= options.cooldownMs);
  if (isHalfOpen && state.halfOpenInFlight >= halfOpenLimit) {
    throw new ResilienceError("CIRCUIT_OPEN", `Circuit is half-open for ${scope}`);
  }

  circuitStore.set(scope, {
    failures: state.failures,
    openedAt: isHalfOpen ? state.openedAt : undefined,
    halfOpenInFlight: isHalfOpen ? state.halfOpenInFlight + 1 : state.halfOpenInFlight,
  });

  try {
    const result = await fn();
    circuitStore.set(scope, { failures: 0, openedAt: undefined, halfOpenInFlight: 0 });
    return result;
  } catch (error) {
    const latest = circuitStore.get(scope) ?? { failures: 0, openedAt: undefined, halfOpenInFlight: 0 };
    const failures = latest.failures + 1;
    const openedAt = failures >= options.failureThreshold ? Date.now() : latest.openedAt;

    circuitStore.set(scope, {
      failures,
      openedAt,
      halfOpenInFlight: Math.max(0, latest.halfOpenInFlight - (isHalfOpen ? 1 : 0)),
    });

    throw error;
  }
}

export function getResilienceSnapshot() {
  return {
    concurrency: Object.fromEntries(concurrencyStore.entries()),
    circuits: Object.fromEntries(
      [...circuitStore.entries()].map(([scope, value]) => [
        scope,
        {
          failures: value.failures,
          isOpen: Boolean(value.openedAt),
          openedAt: value.openedAt,
          halfOpenInFlight: value.halfOpenInFlight,
        },
      ])
    ),
  };
}
