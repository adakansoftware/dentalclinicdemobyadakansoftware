interface SafeQueryOptions {
  timeoutMs?: number;
  shouldLog?: boolean;
  logTimeouts?: boolean;
}

const loggedMessages = new Map<string, number>();

function shouldLogMessage(message: string): boolean {
  const now = Date.now();
  const lastLoggedAt = loggedMessages.get(message) ?? 0;

  if (now - lastLoggedAt < 10_000) {
    return false;
  }

  loggedMessages.set(message, now);
  return true;
}

export async function safeQuery<T>(
  label: string,
  query: () => Promise<T>,
  fallback: T,
  options: SafeQueryOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 2500;
  const shouldLog = options.shouldLog ?? true;
  const logTimeouts = options.logTimeouts ?? false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      query(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (shouldLog) {
      const message = `${label} failed`;
      const isTimeout = error instanceof Error && error.message.startsWith("Timed out after ");

      if ((!isTimeout || logTimeouts) && shouldLogMessage(message)) {
        if (process.env.NODE_ENV === "production") {
          console.error(message);
        } else {
          console.error(`${label} failed:`, error);
        }
      }
    }
    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
