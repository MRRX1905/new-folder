import { z } from "zod";

export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export const usernameSchema = z
  .string()
  .min(3, "Minimal 3 karakter.")
  .max(32, "Maksimal 32 karakter.")
  .regex(USERNAME_PATTERN, "Hanya huruf kecil, angka, titik, garis bawah, dan tanda hubung.");

export const loginSchema = z
  .object({
    username: usernameSchema,
    password: z.string().min(1, "Wajib diisi.").max(128, "Maksimal 128 karakter."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const credentialsUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Wajib diisi.").max(128, "Maksimal 128 karakter."),
    username: usernameSchema.optional(),
    password: z.string().min(12, "Minimal 12 karakter.").max(128, "Maksimal 128 karakter.").optional(),
  })
  .strict()
  .refine((value) => value.username !== undefined || value.password !== undefined, {
    message: "Isi username atau password baru.",
  })
  .refine((value) => !value.username || !value.password || value.password !== value.username, {
    message: "Password tidak boleh sama dengan username.",
  });

export type CredentialsUpdateInput = z.infer<typeof credentialsUpdateSchema>;

export const reauthSchema = z
  .object({
    password: z.string().min(1, "Wajib diisi.").max(128, "Maksimal 128 karakter."),
  })
  .strict();

export type ReauthInput = z.infer<typeof reauthSchema>;
