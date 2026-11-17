import { randomBytes } from "node:crypto";
import type { RequestHandler } from "express";

const newRequestId = (): string => `req_${randomBytes(12).toString("hex")}`;

export const requestId: RequestHandler = (req, res, next) => {
  req.requestId = newRequestId();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
