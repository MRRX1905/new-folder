import type { ErrorCode } from "../errors/error-codes.js";

export interface FieldError {
  path: string;
  message: string;
}

export interface ApiErrorDetails {
  requestId: string;
  reason?: string;
  field?: string;
  fields?: FieldError[];
  [key: string]: unknown;
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details: ApiErrorDetails | null;
  };
}
