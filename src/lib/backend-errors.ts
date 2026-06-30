export type BackendErrorCode =
  | "SLOT_UNAVAILABLE"
  | "APPOINTMENT_NOT_FOUND"
  | "APPOINTMENT_STATUS_CONFLICT"
  | "APPOINTMENT_CANCEL_CONFLICT";

export class BackendError extends Error {
  code: BackendErrorCode;
  meta?: Record<string, unknown>;

  constructor(code: BackendErrorCode, message?: string, meta?: Record<string, unknown>) {
    super(message ?? code);
    this.name = "BackendError";
    this.code = code;
    this.meta = meta;
  }
}

export function isBackendError(error: unknown, code?: BackendErrorCode): error is BackendError {
  if (!(error instanceof BackendError)) {
    return false;
  }

  return code ? error.code === code : true;
}
