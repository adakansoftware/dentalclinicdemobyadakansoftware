import { getRequestIdFromHeaders } from "@/lib/api-security";
import { jsonError } from "@/lib/api-response";

export function methodNotAllowed(request: Request, allowed: string[]) {
  const requestId = getRequestIdFromHeaders(request.headers);

  return jsonError("Method not allowed", {
    requestId,
    status: 405,
    code: "METHOD_NOT_ALLOWED",
    headers: {
      Allow: allowed.join(", "),
    },
  });
}
