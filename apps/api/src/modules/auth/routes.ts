import { Router } from "express";
import { LOGIN_WINDOW_MS } from "@rf/shared";
import { requireAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./controller.js";
import { credentialsUpdateSchema, loginSchema, reauthSchema } from "./schema.js";

export const authRouter: Router = Router();

authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

authRouter.post("/login", validate({ body: loginSchema }), controller.login);
authRouter.post("/logout", controller.logout);
authRouter.get("/session", requireAuth, controller.currentSession);
authRouter.patch(
  "/credentials",
  requireAuth,
  validate({ body: credentialsUpdateSchema }),
  controller.updateCredentials,
);
authRouter.post(
  "/reauth",
  requireAuth,
  rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    max: 5,
    keyPrefix: "reauth",
    keyGenerator: (req) => req.session?.id ?? req.ip ?? "unknown",
    message: "Terlalu banyak percobaan re-autentikasi.",
  }),
  validate({ body: reauthSchema }),
  controller.reauth,
);
