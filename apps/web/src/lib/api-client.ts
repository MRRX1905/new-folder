import type { ApiErrorBody, ErrorCode, FieldError } from "@rf/shared";
import { env } from "./env";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: { requestId?: string; fields?: FieldError[]; [key: string]: unknown } | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error.message ?? "Permintaan gagal.");
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error.code ?? "INTERNAL";
    this.details = body?.error.details ?? null;
  }

  get fields(): FieldError[] {
    return this.details?.fields ?? [];
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

const parseError = async (response: Response): Promise<ApiErrorBody | null> => {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
};

export const apiFetch = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  if (method !== "GET") headers["X-RF-Client"] = "web";
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    credentials: "include",
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response));
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
};
