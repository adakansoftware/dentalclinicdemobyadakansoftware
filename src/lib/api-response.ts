import { NextResponse } from "next/server";
import { buildApiHeaders } from "@/lib/api-security";

interface JsonResponseOptions {
  requestId: string;
  status?: number;
  headers?: Record<string, string>;
}

interface ErrorResponseOptions extends JsonResponseOptions {
  code?: string;
  retryAfterSec?: number;
}

export function jsonOk<T>(data: T, options: JsonResponseOptions) {
  return NextResponse.json(
    {
      success: true,
      requestId: options.requestId,
      data,
    },
    {
      status: options.status ?? 200,
      headers: buildApiHeaders(options.requestId, options.headers),
    }
  );
}

export function jsonError(message: string, options: ErrorResponseOptions) {
  const extraHeaders = {
    ...(options.retryAfterSec ? { "Retry-After": String(options.retryAfterSec) } : {}),
    ...options.headers,
  };

  return NextResponse.json(
    {
      success: false,
      requestId: options.requestId,
      error: message,
      code: options.code,
    },
    {
      status: options.status ?? 400,
      headers: buildApiHeaders(options.requestId, extraHeaders),
    }
  );
}
