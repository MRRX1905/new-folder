import argon2 from "argon2";
import type { Admin, Session } from "@prisma/client";
import {
  AppError,
  LOGIN_ACCOUNT_LOCK_MS,
  LOGIN_ACCOUNT_LOCK_THRESHOLD,
  LOGIN_MAX_FAILURES_PER_IP,
  LOGIN_WINDOW_MS,
  type CredentialsUpdateInput,
} from "@rf/shared";
import { issueReauthToken } from "../../lib/reauth.js";
import {
  createSession,
  revokeOtherSessions,
  revokeSession,
  revokeSessionByToken,
} from "../../lib/session.js";
import * as repository from "./repository.js";

const ARGON_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

interface AttemptWindow {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

const ipAttempts = new Map<string, AttemptWindow>();
const accountAttempts = new Map<string, AttemptWindow>();

const activeWindow = (key: string, store: Map<string, AttemptWindow>): AttemptWindow | null => {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.resetAt <= Date.now() && (entry.lockedUntil ?? 0) <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry;
};

const retrySeconds = (until: number): number => Math.max(1, Math.ceil((until - Date.now()) / 1000));

const assertNotLimited = (ip: string, username: string): void => {
  const account = activeWindow(username, accountAttempts);
  if (account?.lockedUntil && account.lockedUntil > Date.now()) {
    throw new AppError("RATE_LIMITED", "Akun terkunci sementara.", {
      lockedUntil: new Date(account.lockedUntil).toISOString(),
      retryAfterSeconds: retrySeconds(account.lockedUntil),
    });
  }

  const byIp = activeWindow(ip, ipAttempts);
  if (byIp && byIp.count >= LOGIN_MAX_FAILURES_PER_IP) {
    throw new AppError("RATE_LIMITED", "Terlalu banyak percobaan login.", {
      retryAfterSeconds: retrySeconds(byIp.resetAt),
    });
  }
};

const recordFailure = (ip: string, username: string): void => {
  const now = Date.now();

  const ipEntry = activeWindow(ip, ipAttempts);
  ipAttempts.set(ip, {
    count: (ipEntry?.count ?? 0) + 1,
    resetAt: ipEntry?.resetAt ?? now + LOGIN_WINDOW_MS,
  });

  const accountEntry = activeWindow(username, accountAttempts);
  const count = (accountEntry?.count ?? 0) + 1;
  accountAttempts.set(username, {
    count,
    resetAt: accountEntry?.resetAt ?? now + LOGIN_WINDOW_MS,
    ...(count >= LOGIN_ACCOUNT_LOCK_THRESHOLD ? { lockedUntil: now + LOGIN_ACCOUNT_LOCK_MS } : {}),
  });
};

const resetFailures = (ip: string, username: string): void => {
  ipAttempts.delete(ip);
  accountAttempts.delete(username);
};

const hashPassword = (password: string): Promise<string> => argon2.hash(password, ARGON_OPTIONS);

let dummyHash: Promise<string> | null = null;
const getDummyHash = (): Promise<string> =>
  (dummyHash ??= hashPassword("rf-timing-equalizer-placeholder"));

const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
};

const invalidCredentials = (): AppError =>
  AppError.unauthorized("Username atau password salah.");

export interface LoginResult {
  admin: Admin;
  session: Session;
  token: string;
}

export const login = async (username: string, password: string, ip: string): Promise<LoginResult> => {
  assertNotLimited(ip, username);

  const admin = await repository.findAdminByUsername(username);
  const passwordHash = admin?.passwordHash ?? (await getDummyHash());
  const valid = await verifyPassword(passwordHash, password);

  if (!admin || !valid) {
    recordFailure(ip, username);
    throw invalidCredentials();
  }

  resetFailures(ip, username);

  const { token, session } = await createSession(admin.id);
  const updated = await repository.updateAdmin(admin.id, { lastLoginAt: new Date() });

  return { admin: updated, session, token };
};

export const logout = async (token: string | undefined): Promise<void> => {
  if (token) await revokeSessionByToken(token);
};

export const verifyCurrentPassword = async (admin: Admin, password: string): Promise<void> => {
  const valid = await verifyPassword(admin.passwordHash, password);
  if (!valid) {
    throw AppError.unauthorized("Password saat ini salah.", { field: "currentPassword" });
  }
};

export interface CredentialsResult {
  admin: Admin;
  revokedSessions: number;
  token: string;
}

export const updateCredentials = async (
  admin: Admin,
  session: Session,
  input: CredentialsUpdateInput,
): Promise<CredentialsResult> => {
  await verifyCurrentPassword(admin, input.currentPassword);

  if (input.username && input.username !== admin.username) {
    const existing = await repository.findAdminByUsername(input.username);
    if (existing && existing.id !== admin.id) {
      throw AppError.conflict("Username sudah dipakai.", { field: "username" });
    }
  }

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  const updated = await repository.updateAdmin(admin.id, {
    ...(input.username ? { username: input.username } : {}),
    ...(passwordHash ? { passwordHash, passwordUpdatedAt: new Date() } : {}),
  });

  const revokedSessions = await revokeOtherSessions(admin.id, session.id);
  const created = await createSession(admin.id, session.absoluteExpiresAt);
  await revokeSession(session.id);

  return { admin: updated, revokedSessions, token: created.token };
};

export const reauth = async (admin: Admin, password: string) => {
  await verifyCurrentPassword(admin, password);
  return issueReauthToken(admin.id);
};
