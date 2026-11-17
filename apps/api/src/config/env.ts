import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET minimal 32 karakter."),
  FRONTEND_ORIGIN: z.string().url(),

  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),

  RECAPTCHA_SECRET_KEY: z.string().optional(),
  DEEPL_API_KEY: z.string().optional(),
  DEEPL_API_URL: z.string().url().default("https://api-free.deepl.com/v2/translate"),
  VERCEL_DEPLOY_HOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  // Fail fast and keep the output free of secret values.
  process.stderr.write(`[env] Konfigurasi environment tidak valid:\n- ${problems.join("\n- ")}\n`);
  process.exit(1);
}

export const env: Env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
