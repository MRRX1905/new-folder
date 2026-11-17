import type { Request, Response } from "express";
import { AppError, SESSION_COOKIE_NAME } from "@rf/shared";
import { clearSessionCookie, setSessionCookie } from "../../lib/session.js";
import * as service from "./service.js";
import { toAdminDto, toAdminSummary, toSessionDto } from "./serializer.js";

const sessionToken = (req: Request): string | undefined => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[SESSION_COOKIE_NAME];
  return typeof token === "string" ? token : undefined;
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };
  const result = await service.login(username, password, req.ip ?? "unknown");

  setSessionCookie(res, result.token);
  res.status(200).json({
    admin: toAdminDto(result.admin),
    session: toSessionDto(result.session),
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  await service.logout(sessionToken(req));
  clearSessionCookie(res);
  res.status(204).end();
};

export const currentSession = (req: Request, res: Response): void => {
  if (!req.admin || !req.session) {
    throw AppError.unauthorized("Sesi tidak valid.");
  }

  res.status(200).json({
    admin: toAdminDto(req.admin),
    session: toSessionDto(req.session),
  });
};

export const updateCredentials = async (req: Request, res: Response): Promise<void> => {
  if (!req.admin || !req.session) {
    throw AppError.unauthorized("Sesi tidak valid.");
  }

  const result = await service.updateCredentials(req.admin, req.session, req.body);
  setSessionCookie(res, result.token);

  res.status(200).json({
    admin: toAdminSummary(result.admin),
    rotated: true,
    revokedSessions: result.revokedSessions,
  });
};

export const reauth = async (req: Request, res: Response): Promise<void> => {
  if (!req.admin) {
    throw AppError.unauthorized("Sesi tidak valid.");
  }

  const { password } = req.body as { password: string };
  const result = await service.reauth(req.admin, password);

  res.status(200).json({
    reauthToken: result.token,
    expiresAt: result.expiresAt,
  });
};
