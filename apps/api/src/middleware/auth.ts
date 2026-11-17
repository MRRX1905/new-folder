import type { RequestHandler } from "express";
import { SESSION_COOKIE_NAME, AppError } from "@rf/shared";
import {
  clearSessionCookie,
  resolveSession,
  setSessionCookie,
} from "../lib/session.js";

const readCookie = (cookies: unknown, name: string): string | undefined => {
  if (!cookies || typeof cookies !== "object") return undefined;
  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = readCookie(req.cookies, SESSION_COOKIE_NAME);
    if (!token) {
      throw AppError.unauthorized("Sesi tidak ditemukan.");
    }

    const resolved = await resolveSession(token);
    if (!resolved) {
      clearSessionCookie(res);
      throw AppError.unauthorized("Sesi tidak valid.");
    }

    req.admin = resolved.admin;
    req.session = resolved.session;

    if (resolved.rotatedToken) {
      setSessionCookie(res, resolved.rotatedToken);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/** Reads the session when present without rejecting the request. */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readCookie(req.cookies, SESSION_COOKIE_NAME);
    if (!token) {
      next();
      return;
    }

    const resolved = await resolveSession(token);
    if (resolved) {
      req.admin = resolved.admin;
      req.session = resolved.session;
    }
    next();
  } catch {
    // Public endpoints never fail because of an invalid session cookie.
    next();
  }
};
