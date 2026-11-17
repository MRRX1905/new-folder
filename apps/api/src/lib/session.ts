import { createHash, randomBytes } from "node:crypto";
import type { Admin, Session } from "@prisma/client";
import type { CookieOptions } from "express";
import {
  SESSION_ABSOLUTE_MS,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_ROTATION_INTERVAL_MS,
  SESSION_SLIDING_MS,
} from "@rf/shared";
import { isProduction } from "../config/env.js";
import { prisma } from "./prisma.js";
import { newId } from "./ids.js";

export interface ResolvedSession {
  admin: Admin;
  session: Session;
  rotatedToken: string | null;
}

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

const generateToken = (): string => randomBytes(32).toString("base64url");

export const sessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_COOKIE_MAX_AGE_SECONDS * 1000,
});

export const clearSessionCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
});

export const setSessionCookie = (
  res: { cookie: (name: string, value: string, options: CookieOptions) => unknown },
  token: string,
): void => {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
};

export const clearSessionCookie = (res: {
  clearCookie: (name: string, options: CookieOptions) => unknown;
}): void => {
  res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
};

export interface CreatedSession {
  token: string;
  session: Session;
}

export const createSession = async (
  adminId: string,
  absoluteExpiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MS),
): Promise<CreatedSession> => {
  const token = generateToken();
  const now = new Date();

  const session = await prisma.session.create({
    data: {
      id: newId(),
      tokenHash: hashToken(token),
      adminId,
      expiresAt: new Date(now.getTime() + SESSION_SLIDING_MS),
      absoluteExpiresAt,
      lastUsedAt: now,
    },
  });

  return { token, session };
};

/**
 * Validate a raw cookie token.
 * Extends the sliding expiry at most once per hour and rotates the token when
 * it does. Absolute expiry is never extended.
 */
export const resolveSession = async (token: string): Promise<ResolvedSession | null> => {
  const now = new Date();
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= now.getTime() ||
    session.absoluteExpiresAt.getTime() <= now.getTime()
  ) {
    return null;
  }

  const slideThreshold = now.getTime() + SESSION_SLIDING_MS - SESSION_ROTATION_INTERVAL_MS;

  if (session.expiresAt.getTime() < slideThreshold) {
    const rotatedToken = generateToken();
    const rotated = await prisma.$transaction(async (tx) => {
      const revoked = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now, lastUsedAt: now },
      });

      if (revoked.count === 0) return null;

      return tx.session.create({
        data: {
          id: newId(),
          tokenHash: hashToken(rotatedToken),
          adminId: session.adminId,
          expiresAt: new Date(now.getTime() + SESSION_SLIDING_MS),
          absoluteExpiresAt: session.absoluteExpiresAt,
          lastUsedAt: now,
        },
      });
    });

    if (!rotated) return null;

    return { admin: session.admin, session: rotated, rotatedToken };
  }

  await prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: now } });

  return { admin: session.admin, session, rotatedToken: null };
};

export const revokeSession = async (sessionId: string): Promise<void> => {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeSessionByToken = async (token: string): Promise<void> => {
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeOtherSessions = async (adminId: string, keepSessionId: string): Promise<number> => {
  const result = await prisma.session.updateMany({
    where: { adminId, id: { not: keepSessionId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
};
