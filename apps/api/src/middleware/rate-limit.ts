import type { Request, RequestHandler } from "express";
import { AppError } from "@rf/shared";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyGenerator?: (req: Request) => string;
  message?: string;
}

interface Counter {
  count: number;
  resetAt: number;
}

const store = new Map<string, Counter>();

const sweep = (now: number): void => {
  if (store.size < 5_000) return;
  for (const [key, counter] of store) {
    if (counter.resetAt <= now) store.delete(key);
  }
};

/**
 * Single-instance in-memory limiter. The API runs as one Railway instance in
 * v1 (CL-12), so no shared store is required.
 */
export const rateLimit =
  ({ windowMs, max, keyPrefix, keyGenerator, message }: RateLimitOptions): RequestHandler =>
  (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${keyGenerator ? keyGenerator(req) : (req.ip ?? "unknown")}`;
    sweep(now);

    const existing = store.get(key);
    const counter = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

    counter.count += 1;
    store.set(key, counter);

    const remaining = Math.max(0, max - counter.count);
    const resetSeconds = Math.max(1, Math.ceil((counter.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));

    if (counter.count > max) {
      next(
        new AppError("RATE_LIMITED", message ?? "Terlalu banyak permintaan.", {
          retryAfterSeconds: resetSeconds,
        }),
      );
      return;
    }

    next();
  };
