import os from "os";
import path from "path";
import type { NextConfig } from "next";

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string | undefined;
};

function normalizeOrigin(origin: string) {
  return origin.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function tryBuildRemotePattern(origin: string): RemotePattern | null {
  try {
    const normalized = origin.startsWith("http://") || origin.startsWith("https://") ? origin : `https://${origin}`;
    const url = new URL(normalized);

    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
    };
  } catch {
    return null;
  }
}

function getLanOrigins() {
  const interfaces = os.networkInterfaces();
  const origins = new Set<string>();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family !== "IPv4" || address.internal) {
        continue;
      }

      origins.add(`${address.address}:3000`);
    }
  }

  return origins;
}

const allowedOrigins = Array.from(
  new Set([
    "localhost:3000",
    "127.0.0.1:3000",
    ...getLanOrigins(),
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .filter(Boolean)
    .map((origin) => normalizeOrigin(origin!)))
);

const remotePatterns = allowedOrigins
  .map((origin) => tryBuildRemotePattern(origin))
  .filter((pattern): pattern is RemotePattern => Boolean(pattern));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
