import type { Admin, Session } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      validatedQuery?: unknown;
      admin?: Admin;
      session?: Session;
    }
  }
}

export {};
