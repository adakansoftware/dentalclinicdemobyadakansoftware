import { logEvent } from "@/lib/observability";

interface AdminAuditActor {
  id: string;
  name: string;
}

interface LogAdminEventOptions {
  admin: AdminAuditActor;
  event: string;
  route: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export function logAdminEvent({ admin, event, route, message, meta = {} }: LogAdminEventOptions) {
  logEvent({
    event,
    route,
    message,
    meta: {
      adminId: admin.id,
      adminName: admin.name,
      ...meta,
    },
  });
}
