import type { Admin } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export const findAdminByUsername = async (username: string): Promise<Admin | null> =>
  prisma.admin.findUnique({ where: { username } });

export const findAdminById = async (id: string): Promise<Admin | null> =>
  prisma.admin.findUnique({ where: { id } });

export const updateAdmin = async (
  id: string,
  data: { username?: string; passwordHash?: string; passwordUpdatedAt?: Date; lastLoginAt?: Date },
): Promise<Admin> => prisma.admin.update({ where: { id }, data });
