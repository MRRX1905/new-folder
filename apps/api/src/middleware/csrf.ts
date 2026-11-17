import type { RequestHandler } from "express";
import { AppError } from "@rf/shared";
import { env } from "../config/env.js";

const EXEMPT_HEADER_PATHS = new Set(["/api/v1/visits", "/api/v1/translate"]);

const originOf = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * CSRF layers: Origin/Referer allowlist for every non-GET request, plus the
 * `X-RF-Client: web` header except on the two public beacon endpoints.
 * SameSite=Lax on the session cookie is the second layer.
 */
export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const requestOrigin = originOf(req.get("origin")) ?? originOf(req.get("referer"));

  if (!requestOrigin) {
    next(AppError.forbidden("Origin tidak ditemukan.", { reason: "origin_missing" }));
    return;
  }

  if (requestOrigin !== originOf(env.FRONTEND_ORIGIN)) {
    next(AppError.forbidden("Origin tidak diizinkan.", { reason: "origin_mismatch" }));
    return;
  }

  if (!EXEMPT_HEADER_PATHS.has(req.path) && req.get("x-rf-client") !== "web") {
    next(AppError.forbidden("Header klien tidak valid.", { reason: "csrf_header" }));
    return;
  }

  next();
};
