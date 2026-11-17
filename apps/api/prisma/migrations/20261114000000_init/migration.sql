-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "collection_type" AS ENUM ('ai', 'tool', 'website');

-- CreateEnum
CREATE TYPE "category_kind" AS ENUM ('ai', 'tool', 'website', 'project');

-- CreateEnum
CREATE TYPE "usage_status" AS ENUM ('currently_using', 'previously_used', 'exploring', 'want_to_try');

-- CreateEnum
CREATE TYPE "locale" AS ENUM ('id', 'en');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "absoluteExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgentHash" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "tagline" TEXT,
    "bio" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "avatarMediaId" TEXT,
    "locationLabel" TEXT,
    "sourceLocale" "locale" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSort" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "originalName" TEXT NOT NULL,
    "originalNameSort" TEXT NOT NULL,
    "sourceLocale" "locale" NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "kind" "category_kind" NOT NULL,
    "name" TEXT NOT NULL,
    "nameSort" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceLocale" "locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSort" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceLocale" "locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "type" "collection_type" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "name" TEXT NOT NULL,
    "nameSort" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoMediaId" TEXT,
    "usageStatus" "usage_status" NOT NULL,
    "sourceLocale" "locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_links" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSort" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverMediaId" TEXT,
    "primaryUrl" TEXT NOT NULL,
    "sourceLocale" "locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformSort" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "logoMediaId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSort" TEXT NOT NULL,
    "description" TEXT,
    "logoMediaId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceLocale" "locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSort" TEXT NOT NULL,
    "processor" TEXT NOT NULL,
    "ram" TEXT NOT NULL,
    "gpu" TEXT,
    "storage" TEXT NOT NULL,
    "operatingSystem" TEXT NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceLocale" "locale" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_events" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "entryPath" TEXT NOT NULL,
    "referrerHost" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_configuration" (
    "id" TEXT NOT NULL,
    "ownerLat" DOUBLE PRECISION,
    "ownerLng" DOUBLE PRECISION,
    "ownerLocationLabel" TEXT,
    "ownerLocationUpdatedAt" TIMESTAMP(3),
    "ownerLastSeenAt" TIMESTAMP(3),
    "defaultLocale" "locale" NOT NULL DEFAULT 'id',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_configuration" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "subjectPrefix" TEXT NOT NULL DEFAULT '[RF Contact]',
    "captchaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_adminId_idx" ON "sessions"("adminId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "profiles_avatarMediaId_idx" ON "profiles"("avatarMediaId");

-- CreateIndex
CREATE INDEX "media_folders_nameSort_idx" ON "media_folders"("nameSort");

-- CreateIndex
CREATE UNIQUE INDEX "media_publicId_key" ON "media"("publicId");

-- CreateIndex
CREATE INDEX "media_folderId_createdAt_idx" ON "media"("folderId", "createdAt");

-- CreateIndex
CREATE INDEX "media_originalNameSort_idx" ON "media"("originalNameSort");

-- CreateIndex
CREATE INDEX "categories_kind_nameSort_idx" ON "categories"("kind", "nameSort");

-- CreateIndex
CREATE INDEX "categories_nameSort_idx" ON "categories"("nameSort");

-- CreateIndex
CREATE UNIQUE INDEX "categories_kind_name_key" ON "categories"("kind", "name");

-- CreateIndex
CREATE INDEX "subcategories_categoryId_nameSort_idx" ON "subcategories"("categoryId", "nameSort");

-- CreateIndex
CREATE INDEX "subcategories_nameSort_idx" ON "subcategories"("nameSort");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_categoryId_name_key" ON "subcategories"("categoryId", "name");

-- CreateIndex
CREATE INDEX "collection_items_type_categoryId_idx" ON "collection_items"("type", "categoryId");

-- CreateIndex
CREATE INDEX "collection_items_type_usageStatus_idx" ON "collection_items"("type", "usageStatus");

-- CreateIndex
CREATE INDEX "collection_items_nameSort_idx" ON "collection_items"("nameSort");

-- CreateIndex
CREATE INDEX "collection_items_subcategoryId_idx" ON "collection_items"("subcategoryId");

-- CreateIndex
CREATE INDEX "collection_items_logoMediaId_idx" ON "collection_items"("logoMediaId");

-- CreateIndex
CREATE INDEX "item_links_itemId_sortOrder_idx" ON "item_links"("itemId", "sortOrder");

-- CreateIndex
CREATE INDEX "projects_categoryId_titleSort_idx" ON "projects"("categoryId", "titleSort");

-- CreateIndex
CREATE INDEX "projects_titleSort_idx" ON "projects"("titleSort");

-- CreateIndex
CREATE INDEX "projects_coverMediaId_idx" ON "projects"("coverMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_profileUrl_key" ON "social_media"("profileUrl");

-- CreateIndex
CREATE INDEX "social_media_platformSort_idx" ON "social_media"("platformSort");

-- CreateIndex
CREATE INDEX "social_media_logoMediaId_idx" ON "social_media"("logoMediaId");

-- CreateIndex
CREATE INDEX "learning_fields_nameSort_idx" ON "learning_fields"("nameSort");

-- CreateIndex
CREATE INDEX "learning_fields_logoMediaId_idx" ON "learning_fields"("logoMediaId");

-- CreateIndex
CREATE INDEX "devices_nameSort_idx" ON "devices"("nameSort");

-- CreateIndex
CREATE INDEX "timeline_entries_date_idx" ON "timeline_entries"("date");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_mediaId_key" ON "resumes"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_events_visitId_key" ON "visitor_events"("visitId");

-- CreateIndex
CREATE INDEX "visitor_events_createdAt_idx" ON "visitor_events"("createdAt");

-- CreateIndex
CREATE INDEX "visitor_events_isOwner_idx" ON "visitor_events"("isOwner");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "collection_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media" ADD CONSTRAINT "social_media_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_fields" ADD CONSTRAINT "learning_fields_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

