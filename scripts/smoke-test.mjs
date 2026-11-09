import { spawn } from "node:child_process";
import process from "node:process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// `next start` runs in production mode, where the API origin guard only
// accepts the configured app URL — localhost referers are rejected. Read it
// from .env (npm scripts do not load .env into this process).
function readAppUrlFromEnv() {
  try {
    const match = readFileSync(path.join(process.cwd(), ".env"), "utf8").match(/^NEXT_PUBLIC_APP_URL=(.+)$/m);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}
const appUrl = process.env.NEXT_PUBLIC_APP_URL || readAppUrlFromEnv();

const defaultPort = 3200 + Math.floor(Math.random() * 400);
const port = Number(process.env.SMOKE_PORT || defaultPort);
// The app's security layer records suspicion for unauthorized probes (the
// expected-401 cron checks, invalid slots params, the deliberate rate-limit
// loop), persisted in the shared SecurityState table. Probe groups each get
// a fresh random private-loopback IP so a run never crosses its own block
// threshold and never reuses a key poisoned by an earlier run.
function randomSmokeIp() {
  return `127.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${2 + Math.floor(Math.random() * 250)}`;
}
let smokeClientIp = randomSmokeIp();
function rotateSmokeIp() {
  smokeClientIp = randomSmokeIp();
  return smokeClientIp;
}
const cwd = process.cwd();
const nextBin = path.join(cwd, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertHeader(response, headerName, expectedValue) {
  const actualValue = response.headers.get(headerName);
  assert(actualValue === expectedValue, `${headerName} expected ${expectedValue}, got ${actualValue ?? "missing"}`);
}

async function waitForServer(baseUrl, timeoutMs = 45_000) {
  const startedAt = Date.now();
  let lastStatus = "no-response";

  while (Date.now() - startedAt < timeoutMs) {
    try {
      // Poll a static file instead of an API route: the middleware rate
      // limits /api/* (60/min), and a slow boot polled every 500ms would
      // exhaust that budget before the real assertions start.
      const response = await fetch(`${baseUrl}/robots.txt`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
        headers: { "user-agent": "clinic-smoke-test/1.0" },
      });

      if (response.ok) {
        return;
      }

      lastStatus = `status-${response.status}`;
    } catch {}

    await delay(500);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms (last: ${lastStatus})`);
}

async function request(pathname, init) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    ...init,
    // Middleware rejects sensitive pages when the User-Agent is too short;
    // the per-run forwarded IP isolates smoke runs from shared suspicion
    // buckets that production health-check bots pollute.
    headers: {
      "user-agent": "clinic-smoke-test/1.0",
      "x-forwarded-for": smokeClientIp,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  return { status: response.status, text, headers: response.headers };
}

function startServer() {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/c", nextBin, "start", "-p", String(port)], {
      cwd,
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  }

  return spawn(nextBin, ["start", "-p", String(port)], {
    cwd,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function stopServer(server) {
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });

      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }

  server.kill("SIGTERM");
  await delay(500);
  if (!server.killed) {
    server.kill("SIGKILL");
  }
}

async function main() {
  const server = startServer();
  let serverExited = false;
  let stdout = "";
  let stderr = "";

  server.on("exit", () => {
    serverExited = true;
  });

  server.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(`http://127.0.0.1:${port}`);

    const routes = ["/", "/about", "/services", "/appointment", "/admin/login", "/robots.txt", "/sitemap.xml"];
    for (const route of routes) {
      const response = await request(route);
      assert(response.status === 200, `${route} expected 200, got ${response.status}`);
    }

    const admin = await request("/admin");
    assert([307, 308].includes(admin.status), `/admin expected redirect, got ${admin.status}`);
    assert(
      admin.headers.get("location")?.includes("/admin/login"),
      `/admin redirect expected /admin/login, got ${admin.headers.get("location") ?? "missing"}`
    );

    rotateSmokeIp();
    const health = await request("/api/health", {
      headers: process.env.HEALTHCHECK_SECRET
        ? { authorization: `Bearer ${process.env.HEALTHCHECK_SECRET}` }
        : undefined,
    });
    // /api/health (pages router) masks itself as 404 in production when the
    // request carries no HEALTHCHECK_SECRET bearer token.
    if (process.env.HEALTHCHECK_SECRET) {
      assert(health.status === 200, `/api/health expected 200, got ${health.status}`);
      assert(health.text.includes('"ok":true'), "/api/health did not report ok");
    } else {
      assert(health.status === 404, `/api/health expected 404, got ${health.status}`);
    }
    assertHeader(health, "x-content-type-options", "nosniff");
    assertHeader(health, "x-robots-tag", "noindex, nofollow");

    const home = await request("/");
    assertHeader(home, "x-frame-options", "DENY");
    assertHeader(home, "x-content-type-options", "nosniff");
    assertHeader(home, "cross-origin-opener-policy", "same-origin");
    assert(
      (home.headers.get("content-security-policy") ?? "").includes("default-src 'self'"),
      "Homepage did not include content-security-policy"
    );
    const configuredSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (configuredSiteUrl) {
      assert(
        home.text.includes(configuredSiteUrl.replace(/\/$/, "")),
        "Homepage metadata did not include configured site URL"
      );
    }

    rotateSmokeIp();
    const cronUnauthorized = await request("/api/cron/reminders");
    assert(cronUnauthorized.status === 401, `/api/cron/reminders expected 401, got ${cronUnauthorized.status}`);

    rotateSmokeIp();
    const invalidSlots = await request("/api/slots", {
      headers: { origin: appUrl },
    });
    assert(invalidSlots.status === 400, `/api/slots without params expected 400, got ${invalidSlots.status}`);

    const malformedDateSlots = await request("/api/slots?specialistId=test&date=07-04-2026", {
      headers: { origin: appUrl },
    });
    assert(malformedDateSlots.status === 400, `/api/slots malformed date expected 400, got ${malformedDateSlots.status}`);

    const unsupportedHealthMethod = await request("/api/health", {
      method: "POST",
    });
    assert(unsupportedHealthMethod.status === 405, `/api/health POST expected 405, got ${unsupportedHealthMethod.status}`);
    assertHeader(unsupportedHealthMethod, "allow", "GET");

    const specialist = await prisma.specialist.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { order: "asc" },
    });
    assert(Boolean(specialist?.id), "Smoke test could not find an active specialist");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const slotDate = tomorrow.toISOString().slice(0, 10);

    const validSlots = await request(`/api/slots?specialistId=${encodeURIComponent(specialist.id)}&date=${slotDate}`, {
      headers: { origin: appUrl },
    });
    assert(validSlots.status === 200, `/api/slots valid request expected 200, got ${validSlots.status}`);
    assert(validSlots.headers.get("x-slots-cache"), "/api/slots did not include x-slots-cache header");

    rotateSmokeIp();
    const cronWrongSecret = await request("/api/cron/reminders", {
      headers: { authorization: "Bearer definitely-wrong" },
    });
    assert(cronWrongSecret.status === 401, `/api/cron/reminders wrong secret expected 401, got ${cronWrongSecret.status}`);

    let rateLimited = 0;
    rotateSmokeIp();
    for (let i = 0; i < 65; i += 1) {
      const response = await request(`/api/slots?specialistId=${encodeURIComponent(specialist.id)}&date=${slotDate}`, {
        headers: { origin: appUrl },
      });
      if (response.status === 429) {
        rateLimited += 1;
      }
    }

    assert(rateLimited > 0, "Expected slots API to trigger rate limiting");
    console.log("Smoke test passed");
  } finally {
    if (!serverExited) {
      await stopServer(server);
    }
    await prisma.$disconnect();
  }

  if (stderr.trim()) {
    console.error(stderr.trim());
  }

  if (stdout.trim()) {
    console.log(stdout.trim());
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
