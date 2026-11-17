import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { REAUTH_TOKEN_TTL_MS } from "@rf/shared";
import { env } from "../config/env.js";

interface ReauthPayload {
  adminId: string;
  nonce: string;
  exp: number;
}

/** Single-instance store of consumed nonces (CL-12). */
const usedNonces = new Map<string, number>();

const sign = (value: string): string =>
  createHmac("sha256", env.SESSION_SECRET).update(value).digest("base64url");

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

const sweep = (now: number): void => {
  if (usedNonces.size < 1_000) return;
  for (const [nonce, exp] of usedNonces) {
    if (exp <= now) usedNonces.delete(nonce);
  }
};

export const issueReauthToken = (adminId: string): { token: string; expiresAt: Date } => {
  const expiresAt = new Date(Date.now() + REAUTH_TOKEN_TTL_MS);
  const payload: ReauthPayload = {
    adminId,
    nonce: randomBytes(16).toString("hex"),
    exp: expiresAt.getTime(),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `reauth_${encoded}.${sign(encoded)}`, expiresAt };
};

/** Verifies signature, expiry and single use. Returns the admin id or null. */
export const consumeReauthToken = (token: string): string | null => {
  if (!token.startsWith("reauth_")) return null;
  const [encoded, signature] = token.slice("reauth_".length).split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(signature, sign(encoded))) return null;

  let payload: ReauthPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ReauthPayload;
  } catch {
    return null;
  }

  const now = Date.now();
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (usedNonces.has(payload.nonce)) return null;

  usedNonces.set(payload.nonce, payload.exp);
  sweep(now);

  return payload.adminId;
};
