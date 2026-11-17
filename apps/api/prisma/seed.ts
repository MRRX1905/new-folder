/**
 * Seed idempotent — RF Personal Tech Dashboard
 *
 * Aturan:
 * - Semua id dibangkitkan di application layer (TD-07). Baris seed memakai id
 *   stabil 24 karakter (bentuk cuid2: huruf kecil + digit) agar `upsert` tetap
 *   deterministik antar-run. Baris non-seed memakai `createId()`.
 * - `update: {}` dipakai sengaja: seed tidak menimpa perubahan yang dibuat
 *   Admin melalui CMS. Menjalankan ulang seed hanya menambahkan baris yang
 *   hilang.
 * - Tidak ada sample item AI/Tools/Websites/Projects.
 *
 * Jalankan: `npx tsx prisma/seed.ts`
 */

import { PrismaClient, CategoryKind, Locale } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const ID_LENGTH = 24;

/** Nilai sort: lowercase, tanpa diakritik, trim. Harus sama dengan writer CMS. */
const sortKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * id seed stabil 24 karakter. Input wajib menghasilkan slug 1..24 karakter
 * setelah karakter non-alfanumerik dibuang.
 */
const seedId = (key: string): string => {
  const slug = key.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (slug.length === 0 || slug.length > ID_LENGTH) {
    throw new Error(`seedId("${key}") menghasilkan slug ${slug.length} karakter, wajib 1..${ID_LENGTH}`);
  }

  return slug.padEnd(ID_LENGTH, "0");
};

const AI_CATEGORIES = [
  ["Chatbot", "ai-chatbot"],
  ["Image Generation", "ai-imagegeneration"],
  ["Video Generation", "ai-videogeneration"],
  ["Voice AI", "ai-voiceai"],
  ["Coding AI", "ai-codingai"],
  ["Automation", "ai-automation"],
] as const;

const TOOL_CATEGORIES = [
  ["Development Tools", "tool-developmenttools"],
  ["Design Tools", "tool-designtools"],
  ["Productivity Tools", "tool-productivitytools"],
  ["Automation Tools", "tool-automationtools"],
  ["Media & Content Tools", "tool-mediacontenttools"],
] as const;

const PROJECT_CATEGORIES = [
  ["Website", "project-website"],
  ["Mobile App", "project-mobileapp"],
  ["AI", "project-ai"],
  ["Automation", "project-automation"],
  ["Game", "project-game"],
] as const;

const LEARNING_FIELDS = [
  ["Programming", "field-programming"],
  ["AI", "field-ai"],
  ["Cybersecurity", "field-cybersecurity"],
  ["Design", "field-design"],
  ["Networking", "field-networking"],
] as const;

const MEDIA_FOLDERS = [
  ["AI", "folder-ai"],
  ["Tools", "folder-tools"],
  ["Websites", "folder-websites"],
  ["Projects", "folder-projects"],
  ["Profile", "folder-profile"],
] as const;

async function seedCategories(
  kind: CategoryKind,
  entries: ReadonlyArray<readonly [string, string]>,
): Promise<number> {
  let count = 0;

  for (const [index, [name, key]] of entries.entries()) {
    await prisma.category.upsert({
      where: { id: seedId(key) },
      update: {},
      create: {
        id: seedId(key),
        kind,
        name,
        nameSort: sortKey(name),
        sortOrder: index + 1,
        sourceLocale: Locale.ID,
      },
    });
    count += 1;
  }

  return count;
}

async function seedLearningFields(): Promise<number> {
  for (const [index, [name, key]] of LEARNING_FIELDS.entries()) {
    await prisma.learningField.upsert({
      where: { id: seedId(key) },
      update: {},
      create: {
        id: seedId(key),
        name,
        nameSort: sortKey(name),
        sortOrder: index + 1,
        sourceLocale: Locale.ID,
      },
    });
  }

  return LEARNING_FIELDS.length;
}

async function seedMediaFolders(): Promise<number> {
  for (const [name, key] of MEDIA_FOLDERS) {
    await prisma.mediaFolder.upsert({
      where: { id: seedId(key) },
      update: {},
      create: {
        id: seedId(key),
        name,
        nameSort: sortKey(name),
      },
    });
  }

  return MEDIA_FOLDERS.length;
}

async function seedSingletons(): Promise<void> {
  await prisma.siteConfiguration.upsert({
    where: { id: "site_config" },
    update: {},
    create: {
      id: "site_config",
      defaultLocale: Locale.ID,
    },
  });

  await prisma.contactConfiguration.upsert({
    where: { id: "contact_config" },
    update: {},
    create: {
      id: "contact_config",
      recipientEmail: process.env.ADMIN_EMAIL ?? "",
      fromName: "RF Personal Tech Dashboard",
      captchaEnabled: true,
    },
  });
}

async function seedAdmin(): Promise<boolean> {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn("[seed] ADMIN_USERNAME/ADMIN_PASSWORD tidak diset — Admin dilewati.");
    return false;
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.admin.upsert({
    where: { username },
    update: {},
    create: {
      id: createId(),
      username,
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
  });

  return true;
}

async function main(): Promise<void> {
  const aiCount = await seedCategories(CategoryKind.AI, AI_CATEGORIES);
  const toolCount = await seedCategories(CategoryKind.TOOL, TOOL_CATEGORIES);
  const projectCount = await seedCategories(CategoryKind.PROJECT, PROJECT_CATEGORIES);
  const fieldCount = await seedLearningFields();
  const folderCount = await seedMediaFolders();

  await seedSingletons();
  const adminCreated = await seedAdmin();

  console.log(
    [
      "[seed] selesai.",
      `categories: ai=${aiCount} tool=${toolCount} project=${projectCount}`,
      `learningFields=${fieldCount}`,
      `mediaFolders=${folderCount}`,
      "siteConfiguration=site_config contactConfiguration=contact_config",
      `admin=${adminCreated ? "upserted" : "skipped"}`,
      "collectionItems=0 (tanpa data sampel)",
    ].join(" "),
  );
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error) {
    console.error("[seed] gagal:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();
