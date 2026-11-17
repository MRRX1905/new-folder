import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@rf/shared";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../lib/logger.js";

interface BodyParserError extends Error {
  status?: number;
  type?: string;
}

const zodDetails = (error: ZodError) => ({
  fields: error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});

const normalize = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return AppError.badRequest("Payload tidak valid.", zodDetails(error));
  }

  const parserError = error as BodyParserError;
  if (parserError?.type === "entity.too.large" || parserError?.status === 413) {
    return new AppError("PAYLOAD_TOO_LARGE", "Payload melebihi batas.");
  }
  if (parserError?.type === "entity.parse.failed") {
    return AppError.badRequest("Body JSON tidak valid.");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return AppError.conflict("Data dengan nilai unik yang sama sudah ada.");
    }
    if (error.code === "P2025") {
      return AppError.notFound();
    }
    if (error.code === "P2003") {
      return AppError.conflict("Data masih direferensikan.");
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return AppError.internal("Terjadi kesalahan internal.", { reason: "database_unavailable" });
  }

  return AppError.internal();
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError = normalize(error);
  const requestId = req.requestId ?? "unknown";

  if (appError.status >= 500) {
    logger.error({ err: error, requestId }, "request failed");
  } else {
    logger.warn({ code: appError.code, requestId }, "request rejected");
  }

  const retryAfter = appError.details?.["retryAfterSeconds"];
  if (appError.status === 429 && typeof retryAfter === "number") {
    res.setHeader("Retry-After", String(retryAfter));
  }

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      details: { ...(appError.details ?? {}), requestId },
    },
  });
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.path} tidak ditemukan.`));
};
