import { prisma } from "../../lib/prisma.js";

export type DatabaseStatus = "ONLINE" | "OFFLINE";

const TIMEOUT_MS = 2_000;

export const checkDatabase = async (): Promise<DatabaseStatus> => {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<DatabaseStatus>((resolve) => {
    timer = setTimeout(() => resolve("OFFLINE"), TIMEOUT_MS);
  });

  const probe = prisma.$queryRaw`SELECT 1`.then(
    () => "ONLINE" as DatabaseStatus,
    () => "OFFLINE" as DatabaseStatus,
  );

  try {
    return await Promise.race([probe, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};
