import { NextResponse } from "next/server";
import { buildApiHeaders, getRequestIdFromHeaders } from "@/lib/api-security";

export function methodNotAllowed(request: Request, allowed: string[]) {
  const requestId = getRequestIdFromHeaders(request.headers);

  return NextResponse.json(
    { error: "Method not allowed" },
    {
      status: 405,
      headers: buildApiHeaders(requestId, {
        Allow: allowed.join(", "),
      }),
    }
  );
}
