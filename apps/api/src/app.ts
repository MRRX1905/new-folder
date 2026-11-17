import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { pinoHttp } from "pino-http";
import { LIMITS } from "@rf/shared";
import { env, isProduction } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { requestId } from "./middleware/request-id.js";
import { authRouter } from "./modules/auth/routes.js";
import { healthRouter } from "./modules/health/routes.js";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
    }),
  );

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-RF-Client"],
      exposedHeaders: [
        "X-Request-Id",
        "RateLimit-Limit",
        "RateLimit-Remaining",
        "RateLimit-Reset",
        "Retry-After",
      ],
      maxAge: 600,
    }),
  );

  app.use((_req, res, next) => {
    res.setHeader("Vary", "Origin");
    next();
  });

  app.use(cookieParser());
  app.use(express.json({ limit: LIMITS.jsonBodyBytes }));
  app.use(csrfProtection);

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/admin/auth", authRouter);

  if (!isProduction) {
    app.get("/", (_req, res) => {
      res.status(200).json({ name: "RF Personal Tech Dashboard API", version: "v1" });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
