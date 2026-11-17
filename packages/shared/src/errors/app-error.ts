import { ERROR_STATUS, type ErrorCode } from "./error-codes.js";

export type AppErrorDetails = Record<string, unknown> | null;

/**
 * Error that the API error middleware turns into the documented error envelope.
 * Messages must stay safe: no stack traces, SQL, file paths, env names or secrets.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: AppErrorDetails;

  constructor(code: ErrorCode, message: string, details: AppErrorDetails = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }

  static badRequest(message: string, details: AppErrorDetails = null): AppError {
    return new AppError("VALIDATION_ERROR", message, details);
  }

  static unauthorized(message = "Sesi tidak valid.", details: AppErrorDetails = null): AppError {
    return new AppError("UNAUTHORIZED", message, details);
  }

  static forbidden(message = "Permintaan ditolak.", details: AppErrorDetails = null): AppError {
    return new AppError("FORBIDDEN", message, details);
  }

  static notFound(message = "Resource tidak ditemukan.", details: AppErrorDetails = null): AppError {
    return new AppError("NOT_FOUND", message, details);
  }

  static conflict(message: string, details: AppErrorDetails = null): AppError {
    return new AppError("CONFLICT", message, details);
  }

  static internal(message = "Terjadi kesalahan internal.", details: AppErrorDetails = null): AppError {
    return new AppError("INTERNAL", message, details);
  }
}
