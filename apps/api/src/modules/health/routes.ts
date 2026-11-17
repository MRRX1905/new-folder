import { Router } from "express";
import { checkDatabase } from "./service.js";

export const healthRouter: Router = Router();

healthRouter.get("/", async (_req, res) => {
  const database = await checkDatabase();
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ database, checkedAt: new Date() });
});
