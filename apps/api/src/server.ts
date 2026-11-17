import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, "API listening");
});

const shutdown = (signal: string): void => {
  logger.info({ signal }, "shutting down");
  server.close(() => {
    void prisma
      .$disconnect()
      .catch((error: unknown) => logger.error({ err: error }, "prisma disconnect failed"))
      .finally(() => process.exit(0));
  });

  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
