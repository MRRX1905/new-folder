import type { Admin, Session } from "@prisma/client";

export const toAdminDto = (admin: Admin) => ({
  id: admin.id,
  username: admin.username,
  passwordUpdatedAt: admin.passwordUpdatedAt,
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
});

export const toAdminSummary = (admin: Admin) => ({
  id: admin.id,
  username: admin.username,
  passwordUpdatedAt: admin.passwordUpdatedAt,
});

export const toSessionDto = (session: Session) => ({
  createdAt: session.createdAt,
  expiresAt: session.expiresAt,
  absoluteExpiresAt: session.absoluteExpiresAt,
  lastUsedAt: session.lastUsedAt,
});
