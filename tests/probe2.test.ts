import { test } from "vitest";
import { appendFileSync } from "node:fs";

test("probe prisma import", async () => {
  appendFileSync("probe-result.txt", `env=${process.env.DATABASE_URL ? "SET" : "UNSET"}\n`);
  try {
    const mod = await import("@/lib/prisma");
    appendFileSync("probe-result.txt", `prisma import OK, client=${typeof mod.prisma}\n`);
    try {
      const count = await mod.prisma.securityState.count();
      appendFileSync("probe-result.txt", `db count OK=${count}\n`);
    } catch (e) {
      appendFileSync("probe-result.txt", `db query failed: ${(e as Error).message.slice(0, 80)}\n`);
    }
  } catch (e) {
    appendFileSync("probe-result.txt", `prisma import failed: ${(e as Error).message.slice(0, 80)}\n`);
  }
});
