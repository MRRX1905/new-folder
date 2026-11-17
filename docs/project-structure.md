# Struktur Proyek — RF Personal Tech Dashboard

**Versi:** 1.0  
**Tanggal:** 2026-11-14  
**Acuan:** `docs/blueprint-v1.0.md`, `docs/technical-decisions.md` (TD menang bila konflik), `docs/api-spec.md`, `prisma/schema.prisma`, `docs/erd.md`, `docs/ui-wireframe-spec.md`  
**Status:** Struktur target. Monorepo npm workspaces.

Pohon di bawah adalah kondisi akhir setelah Phase 6. File yang belum ada ditandai komentar. Implementasi mengikuti `## Urutan Implementasi`.

---

## Prinsip

1. **Batas public/admin.** Rute publik (`apps/web/src/routes/*`) dan admin (`apps/web/src/routes/admin/*`) memakai shell berbeda (`components/layout/app-shell.tsx` vs `admin-shell.tsx`). Bundle admin di-lazy-load dan tidak boleh masuk chunk publik. Otorisasi tetap di API; guard UI hanya UX.
2. **Shared schema Zod adalah satu sumber validasi.** Aturan field, pagination, enum, batas upload, dan bentuk response hidup di `packages/shared/src/schemas/`. API memakai schema itu di middleware `validate`; web memakai schema yang sama untuk React Hook Form dan tipe `z.infer`. Tidak ada duplikasi aturan validasi.
3. **Tidak ada secret di web.** Hanya variabel `VITE_*` yang boleh ada di `apps/web`. Cloudinary secret, SMTP, DeepL, reCAPTCHA secret, `DATABASE_URL`, dan `SESSION_SECRET` hanya di `apps/api`.
4. **Konten CMS tanpa deploy.** Seluruh konten dinamis dibaca dari PostgreSQL saat runtime melalui TanStack Query. Prerender hanya snapshot SEO; freshness ditangani Deploy Hook (TD-11). Tidak ada item CMS di source code.
5. **TD adalah acuan mengikat.** Konflik produk → blueprint; konflik teknis → `docs/technical-decisions.md`. Perubahan struktur yang menyentuh TD harus merevisi dokumen TD lebih dulu.
6. **Workspace terisolasi.** `@rf/web` tidak boleh mengimpor `apps/api/**` atau `@prisma/client`. Satu-satunya paket bersama adalah `@rf/shared`.

---

## Pohon Direktori

### Root

```text
C:\project\New folder\
├── package.json                     # workspaces: apps/*, packages/*; script root
├── package-lock.json
├── tsconfig.json                    # solution file: references apps/web, apps/api, packages/shared
├── tsconfig.base.json               # strict, moduleResolution, path alias @rf/shared
├── eslint.config.js                 # flat config; aturan per workspace
├── .prettierrc.json
├── .prettierignore
├── .editorconfig
├── .gitignore                       # node_modules, dist, .env, coverage, playwright-report
├── .nvmrc                           # 22
├── README.md
├── docs/
│   ├── blueprint-v1.0.md
│   ├── technical-decisions.md
│   ├── erd.md
│   ├── ui-wireframe-spec.md
│   ├── acceptance-test-plan.md
│   ├── project-structure.md         # dokumen ini
│   └── api-spec.md                  # kontrak endpoint final; 88 endpoint
├── e2e/
│   ├── playwright.config.ts
│   ├── fixtures/
│   │   ├── auth.ts                  # login admin, simpan storageState
│   │   ├── api.ts                   # seed/reset data lewat API + Prisma test DB
│   │   └── seed.ts                  # data uji minimal
│   ├── public/
│   │   ├── welcome.spec.ts
│   │   ├── workspace.spec.ts
│   │   ├── collections.spec.ts      # /ai, /ai/:id, prev/next, Load More
│   │   ├── search.spec.ts
│   │   ├── contact.spec.ts
│   │   └── seo.spec.ts              # title, OG, sitemap, 404
│   ├── admin/
│   │   ├── login.spec.ts
│   │   ├── cms.spec.ts
│   │   ├── media.spec.ts
│   │   ├── backup-restore.spec.ts
│   │   └── auth-settings.spec.ts
│   └── a11y/
│       └── keyboard.spec.ts         # drawer, search, tabel, dialog
├── apps/
│   ├── web/
│   └── api/
└── packages/
    └── shared/
```

**Prisma saat ini ada di root.** `prisma/schema.prisma` dan `prisma/seed.ts` adalah lokasi sekarang. Phase 1 wajib memindahkannya:

```bash
git mv prisma apps/api/prisma
```

Setelah dipindah, tidak boleh ada salinan kedua di root. `docs/erd.md` yang menyebut `prisma/schema.prisma` dibaca sebagai `apps/api/prisma/schema.prisma`.

### `apps/web` — Vite + React + TypeScript

```text
apps/web/
├── package.json                     # @rf/web
├── tsconfig.json                    # references ../../packages/shared
├── vite.config.ts                   # @vitejs/plugin-react, @tailwindcss/vite, alias @rf/shared
├── vitest.config.ts                 # unit test (jsdom)
├── vercel.json                      # rewrite sitemap/robots + SPA fallback
├── index.html                       # memuat /src/entry-client.tsx
├── .env.example
├── public/
│   ├── favicon.svg
│   └── fonts/
│       └── README.md                # font final belum diputuskan (wireframe §1.7)
├── scripts/
│   └── prerender.mjs                # dijalankan setelah build; menulis dist/<route>/index.html
└── src/
    ├── entry-client.tsx             # hydrateRoot / createRoot, QueryClientProvider, RouterProvider
    ├── entry-server.tsx             # render(url) untuk prerender; tidak dikirim ke browser
    ├── vite-env.d.ts
    ├── routes/
    │   ├── router.tsx               # createBrowserRouter; peta path → file rute
    │   ├── root.tsx                 # shell publik, error boundary, ScrollRestoration
    │   ├── welcome.tsx              # /
    │   ├── workspace.tsx            # /workspace
    │   ├── ai.tsx                   # /ai
    │   ├── ai-detail.tsx            # /ai/:id
    │   ├── tools.tsx                # /tools
    │   ├── tools-detail.tsx         # /tools/:id
    │   ├── websites.tsx             # /websites
    │   ├── websites-detail.tsx      # /websites/:id
    │   ├── projects.tsx             # /projects
    │   ├── tech-stack.tsx           # /tech-stack
    │   ├── learning-journey.tsx     # /learning-journey
    │   ├── setup.tsx                # /setup
    │   ├── timeline.tsx             # /timeline
    │   ├── statistics.tsx           # /statistics
    │   ├── about.tsx                # /about
    │   ├── contact.tsx              # /contact
    │   ├── privacy-policy.tsx       # /privacy-policy
    │   ├── not-found.tsx            # 404
    │   └── admin/
    │       ├── layout.tsx           # /admin/* guard sesi + shell admin
    │       ├── login.tsx            # /admin/login
    │       ├── overview.tsx         # /admin
    │       ├── ai.tsx               # /admin/ai
    │       ├── tools.tsx            # /admin/tools
    │       ├── websites.tsx         # /admin/websites
    │       ├── social-media.tsx     # /admin/social-media
    │       ├── projects.tsx         # /admin/projects
    │       ├── learning-journey.tsx # /admin/learning-journey
    │       ├── setup.tsx            # /admin/setup
    │       ├── timeline.tsx         # /admin/timeline
    │       ├── media.tsx            # /admin/media
    │       ├── profile.tsx          # /admin/profile
    │       ├── cv.tsx               # /admin/cv
    │       ├── visitors.tsx         # /admin/visitors
    │       ├── email.tsx            # /admin/email
    │       ├── backup.tsx           # /admin/backup
    │       └── auth.tsx             # /admin/auth
    ├── components/
    │   ├── ui/                      # shadcn/ui + Base UI, kebab-case
    │   │   ├── alert-dialog.tsx
    │   │   ├── button.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── dialog.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── popover.tsx
    │   │   ├── select.tsx
    │   │   ├── sheet.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── sonner.tsx
    │   │   ├── table.tsx
    │   │   ├── textarea.tsx
    │   │   └── tooltip.tsx
    │   ├── layout/
    │   │   ├── app-shell.tsx
    │   │   ├── admin-shell.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── sidebar-nav.tsx
    │   │   ├── mobile-drawer.tsx
    │   │   ├── header.tsx
    │   │   ├── footer.tsx
    │   │   ├── ambient-background.tsx
    │   │   └── skip-link.tsx
    │   ├── public/
    │   │   ├── welcome-hero.tsx
    │   │   ├── stat-grid.tsx
    │   │   ├── social-strip.tsx
    │   │   ├── project-card.tsx
    │   │   ├── device-spec-list.tsx
    │   │   ├── timeline-rail.tsx
    │   │   ├── theme-switcher.tsx
    │   │   ├── language-switcher.tsx
    │   │   ├── mini-player.tsx
    │   │   ├── empty-state.tsx
    │   │   └── error-panel.tsx
    │   └── admin/
    │       ├── page-header.tsx
    │       ├── data-table.tsx
    │       ├── list-toolbar.tsx
    │       ├── crud-panel.tsx       # panel form 520 px / sheet mobile
    │       ├── delete-dialog.tsx
    │       ├── category-manager.tsx
    │       ├── stat-card.tsx
    │       └── visits-chart.tsx
    ├── features/
    │   ├── collections/
    │   │   ├── api.ts
    │   │   ├── queries.ts           # query key + infinite query options
    │   │   ├── hooks.ts
    │   │   └── components/
    │   │       ├── collection-page.tsx
    │   │       ├── category-header.tsx
    │   │       ├── item-card.tsx
    │   │       ├── item-detail.tsx
    │   │       └── load-more.tsx
    │   ├── search/
    │   │   ├── api.ts
    │   │   ├── use-global-search.ts
    │   │   └── components/
    │   │       ├── search-overlay.tsx
    │   │       ├── category-chips.tsx
    │   │       └── search-results.tsx
    │   ├── media/
    │   │   ├── api.ts
    │   │   ├── use-media-upload.ts
    │   │   └── components/
    │   │       ├── media-library.tsx
    │   │       ├── media-picker.tsx
    │   │       └── upload-dropzone.tsx
    │   ├── audio/
    │   │   ├── audio-provider.tsx   # satu elemen <audio> di root
    │   │   ├── use-audio.ts
    │   │   ├── tracks.ts
    │   │   └── sfx.ts
    │   ├── theme/
    │   │   ├── themes.ts            # VOID, EMBER, ION, CHROME, SIGNAL
    │   │   └── use-theme.ts
    │   ├── i18n/
    │   │   ├── translation-client.ts
    │   │   ├── use-translate.ts
    │   │   └── translate-fields.ts
    │   ├── presence/
    │   │   ├── api.ts
    │   │   └── use-presence.ts
    │   ├── contact/
    │   │   ├── api.ts
    │   │   ├── use-contact-form.ts
    │   │   └── components/
    │   │       ├── contact-form.tsx
    │   │       └── recaptcha-field.tsx
    │   └── backup/
    │       ├── api.ts
    │       ├── use-backup.ts
    │       └── components/
    │           ├── backup-panel.tsx
    │           └── restore-dialog.tsx
    ├── lib/
    │   ├── api-client.ts            # fetch + credentials include + X-RF-Client
    │   ├── query-client.ts
    │   ├── seo.ts                   # title, meta, OG, JSON-LD
    │   ├── utils.ts
    │   ├── env.ts                   # validasi VITE_* saat boot
    │   ├── motion-tier.ts           # full | lite (TD-10)
    │   └── errors.ts
    ├── stores/
    │   ├── sidebar-store.ts
    │   ├── theme-store.ts
    │   ├── audio-store.ts
    │   └── search-store.ts
    ├── styles/
    │   ├── tokens.css
    │   ├── themes.css
    │   └── globals.css
    ├── hooks/
    │   ├── use-clock.ts
    │   ├── use-debounce.ts
    │   ├── use-focus-trap.ts
    │   ├── use-media-query.ts
    │   ├── use-online-status.ts
    │   ├── use-scroll-restore.ts
    │   └── use-prefers-reduced-motion.ts
    └── i18n/
        ├── id.ts                    # kamus UI Indonesia
        ├── en.ts                    # kamus UI Inggris
        ├── types.ts
        └── index.ts
```

Catatan:
- `src/i18n/` hanya kamus UI statis (TD-15 butir 4). Orkestrasi terjemahan konten ada di `features/i18n/`.
- `entry-server.tsx` hanya diimpor `scripts/prerender.mjs`; tidak pernah masuk bundle klien.
- `routes/router.tsx` adalah satu-satunya tempat pemetaan path. Nama file tidak menentukan URL.

### `apps/api` — Express 5 + TypeScript + Prisma

```text
apps/api/
├── package.json                     # @rf/api; prisma CLI di dependencies (migrate deploy di runtime)
├── tsconfig.json                    # references ../../packages/shared
├── vitest.config.ts                 # unit + Supertest (test DB terpisah)
├── Dockerfile                       # multi-stage; lihat Build & Deploy
├── .dockerignore
├── .env.example
├── prisma/
│   ├── schema.prisma                # hasil pindahan dari prisma/ root (Phase 1)
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20261114000000_init/
│           └── migration.sql
├── scripts/
│   └── restore.ts                   # CLI: npm run restore -- <file.sql> (TD-13)
└── src/
    ├── app.ts                       # express app, middleware global, mount router, error handler
    ├── server.ts                    # listen, graceful shutdown SIGTERM/SIGINT
    ├── config/
    │   └── env.ts                   # validasi env dengan Zod; fail fast
    ├── middleware/
    │   ├── request-id.ts            # X-Request-Id / UUID
    │   ├── auth.ts                  # validasi cookie rf_sess → req.admin
    │   ├── csrf.ts                  # Origin/Referer + X-RF-Client; kecuali /visits, /translate
    │   ├── rate-limit.ts            # factory per endpoint (login, contact, translate, visits)
    │   ├── validate.ts              # body/query/params dari @rf/shared
    │   └── error.ts                 # AppError → response aman + pino
    ├── modules/
    │   ├── auth/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── profile/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── collections/
    │   │   ├── routes.ts            # publik /collections/:type, admin /admin/:type
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── categories/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── projects/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── tech-stack/
    │   │   ├── routes.ts            # menunggu model TechStackItem (api-spec)
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── social-media/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── learning-journey/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── devices/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── timeline/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── statistics/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── search/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── visits/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── presence/
    │   │   ├── routes.ts            # /presence publik, /admin/presence/heartbeat, lokasi owner
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── contact/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── resume/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── media/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── translate/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts           # in-flight coalescing; tanpa cache (TD-04)
    │   │   └── schema.ts
    │   ├── backup/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   ├── overview/
    │   │   ├── routes.ts
    │   │   ├── controller.ts
    │   │   ├── service.ts
    │   │   ├── repository.ts
    │   │   ├── schema.ts
    │   │   └── serializer.ts
    │   └── health/
    │       ├── routes.ts            # /api/v1/health
    │       └── service.ts           # SELECT 1
    ├── lib/
    │   ├── prisma.ts                # PrismaClient singleton
    │   ├── cloudinary.ts            # signature + verifikasi metadata; tanpa destroy
    │   ├── mailer.ts                # Nodemailer transport (TD-12)
    │   ├── deepl.ts                 # HTTP client, timeout 5 dtk
    │   ├── recaptcha.ts             # verifikasi server-side
    │   ├── backup.ts                # pg_dump/psql, snapshot, verifikasi (TD-13)
    │   ├── logger.ts                # pino + redact cookie/authorization/password
    │   ├── session.ts               # buat/rotasi/revoke, SHA-256 token, sliding + cap
    │   ├── ids.ts                   # createId() cuid2
    │   └── sort.ts                  # nameSort: lowercase, tanpa diakritik, trim
    ├── jobs/
    │   └── deploy-hook.ts           # debounce 5 menit; fire-and-forget (TD-11)
    └── types/
        └── express.d.ts             # Request.requestId, Request.admin, Request.session
```

Catatan:
- Modul tanpa persistensi tidak memaksa `repository.ts`: `translate/` mengoalesensi request di service, `health/` hanya routes + service.
- `routes.ts` mengekspor `publicRouter` dan `adminRouter`; `app.ts` yang menentukan mount dan middleware auth/CSRF. Route tidak boleh menyentuh Prisma.
- `serializer.ts` adalah satu-satunya tempat membentuk DTO publik: membuang `nameSort`, `passwordHash`, `tokenHash`, `publicId` yang tidak perlu, dan menerapkan transformasi Cloudinary.

### `packages/shared` — Zod, tipe, konstanta, kode error

```text
packages/shared/
├── package.json                     # @rf/shared; exports dist; sideEffects false
├── tsconfig.json                    # composite: true
└── src/
    ├── index.ts
    ├── schemas/
    │   ├── auth.ts
    │   ├── backup.ts
    │   ├── category.ts
    │   ├── collection.ts
    │   ├── contact.ts
    │   ├── device.ts
    │   ├── learning-field.ts
    │   ├── media.ts
    │   ├── overview.ts
    │   ├── pagination.ts
    │   ├── presence.ts
    │   ├── profile.ts
    │   ├── project.ts
    │   ├── resume.ts
    │   ├── search.ts
    │   ├── social-media.ts
    │   ├── statistics.ts
    │   ├── tech-stack.ts
    │   ├── timeline.ts
    │   ├── translate.ts
    │   ├── visit.ts
    │   └── index.ts
    ├── types/
    │   ├── api.ts                   # ApiResponse, ApiError, Paginated
    │   ├── domain.ts                # z.infer untuk DTO
    │   ├── query.ts                 # params list/detail
    │   └── index.ts
    ├── constants/
    │   ├── pagination.ts            # 12/+12, 20/+20, 24/+48, search 5/20 (TD-08)
    │   ├── limits.ts                # 5 MB, 512 KB, 10 MB, 100 MB, 80 MB (TD-13/TD-14)
    │   ├── locales.ts               # id | en
    │   ├── usage-status.ts
    │   ├── media.ts                 # lima folder tetap
    │   ├── session.ts               # 30 hari, 90 hari, cookie rf_sess (TD-06)
    │   └── index.ts
    └── errors/
        ├── error-codes.ts           # UPPER_SNAKE sesuai api-spec; alasan di details.reason
        ├── app-error.ts
        └── index.ts
```

Catatan:
- `@rf/shared` dibangun sebagai project reference (`dist`), sedangkan dev web memakai alias Vite ke `src` agar HMR. API dev memakai `tsconfig` paths ke `src`; build produksi memakai `dist`.
- Tidak ada dependensi runtime ke Express, React, atau Prisma di paket ini.

---

## Konvensi Penamaan

| Objek | Aturan | Contoh |
|---|---|---|
| File & folder | kebab-case | `item-card.tsx`, `learning-journey/`, `deploy-hook.ts` |
| Komponen React | ekspor PascalCase, satu komponen utama per file | `export function ItemCard()` |
| Hook | `use-` + camelCase pada nama ekspor | file `use-debounce.ts` → `useDebounce` |
| Route file | `<segment>.tsx`; detail `<segment>-detail.tsx`; admin di `routes/admin/<resource>.tsx` | `ai.tsx`, `ai-detail.tsx`, `admin/media.tsx` |
| URL | cuid2 24 karakter, tanpa slug (TD-07) | `/ai/ckz1r2m3n4p5q6r7s8t9u0v1` |
| Model Prisma | PascalCase singular | `CollectionItem`, `MediaFolder` |
| Tabel/kolom DB | snake_case plural via `@@map`/`@map` | `collection_items`, `logo_media_id` |
| Enum DB | snake_case | `currently_using` |
| Variabel/fungsi | camelCase | `buildCollectionWhere` |
| Tipe/interface | PascalCase tanpa prefiks `I` | `CollectionItemDto` |
| Zod schema | `xxxSchema`; tipe turunan `XxxInput` | `collectionCreateSchema` |
| Env | UPPER_SNAKE; web hanya `VITE_*` | `VITE_API_BASE_URL`, `DATABASE_URL` |
| Query key | array konstan, domain lalu parameter | `['collections', 'ai', { cursor, categoryId }]` |
| Mutation key | `['<domain>', '<aksi>']` | `['media', 'upload']` |
| Cache key browser | `rf.<domain>.<key>` | `rf.theme`, `rf.audio.volume`, `rf.scroll:/ai` |
| Custom event | `rf:<domain>:<aksi>` | `rf:audio:mute`, `rf:theme:change` |
| Kode error | UPPER_SNAKE, kontrak `docs/api-spec.md` | `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED` |
| CSS variable | `--rf-*`; tema via `data-theme` | `--rf-accent`, `<html data-theme="void">` |
| Test | Vitest `*.test.ts(x)`; Playwright `*.spec.ts` | `item-card.test.tsx`, `collections.spec.ts` |
| `data-testid` | kebab-case, stabil | `data-testid="load-more"` |

Aturan tambahan:
- Satu file = satu tanggung jawab. `controller.ts` tidak berisi query; `repository.ts` tidak berisi aturan bisnis.
- Impor lintas workspace hanya lewat `@rf/shared`. Impor relatif di dalam `apps/*` boleh.
- Nama route file tidak dipakai untuk URL; `routes/router.tsx` adalah sumber pemetaan.

---

## Batas State

| State | Tempat | Contoh | Aturan umur / sinkronisasi |
|---|---|---|---|
| Data server publik | TanStack Query | profil, statistik, koleksi, proyek, timeline, presence, hasil search | Sumber kebenaran. `staleTime` per domain di `lib/query-client.ts`; presence 30 dtk (TD-02); search `gcTime: 0` (wireframe §5.6) |
| Data server admin | TanStack Query | sesi admin, overview, daftar CRUD, media, visitor stats | Mutasi meng-invalidate key domain + `['admin','overview']`; tidak disalin ke Zustand |
| Sesi admin | Cookie `rf_sess` + query `['admin','session']` | status login, expiry | HttpOnly, tidak dapat dibaca JS. 401 → invalidate sesi + redirect `/admin/login` |
| Tema | Zustand `theme-store` + `data-theme` | `void`, `ember`, `ion`, `chrome`, `signal` | `sessionStorage` `rf.theme` untuk antar-route; reset ke `void` saat reload (wireframe §12 butir 1) |
| Audio | Zustand `audio-store` + `AudioProvider` | track aktif, play/pause, volume, master mute | Volume `rf.audio.volume`, mute `rf.audio.muted` di `localStorage` (TD-05). Satu elemen `<audio>` di root |
| Sidebar / drawer | Zustand `sidebar-store` | expanded, rail, hidden, drawer terbuka | Memori sesi aplikasi; reload kembali expanded; drawer selalu tertutup saat mount |
| Search overlay | Zustand `search-store` | query, chip kategori, indeks aktif, buka/tutup | Ephemeral; reset saat ditutup; tidak ada riwayat |
| Locale & kamus UI | React Context `LocaleProvider` | `id` / `en`, fungsi `t()` | Default `id`. Persistensi pilihan bahasa **belum diputuskan** (wireframe §6.6); jangan memakai key tema |
| Tier animasi | React Context `MotionTierProvider` | `full` / `lite` | Ditentukan sekali saat boot (TD-10); read-only |
| Terjemahan konten | TanStack Query per halaman | hasil `/translate` | Tanpa cache persisten; fallback teks asli; coalescing di server (TD-04) |
| Form | React Hook Form lokal komponen | field admin, kontak | Schema dari `@rf/shared`; tidak masuk store global |
| Pencarian/sort tabel admin | state lokal komponen | query nama, sort | Tidak di URL; reset saat unmount |
| URL | React Router params/search params | `:id`, `?folder=` di `/admin/media` | Hanya identitas resource. Tidak ada `/search?q=`; cursor/limit tidak di URL |
| Posisi scroll | `sessionStorage` | `rf.scroll:<path>` | Dipulihkan saat back dari detail (wireframe §5.7) |
| `visitId` | memori modul | UUID sekali per boot | Dikirim 1 detik setelah boot (TD-03); tidak dipersist |
| Toast | Sonner lokal | sukses/gagal | Ephemeral; error tidak auto-dismiss |
| Token/secret | tidak ada di web | — | Dilarang di `localStorage`, `sessionStorage`, atau state global |

Aturan: data server tidak boleh disalin ke Zustand. Zustand hanya untuk state UI yang tidak berasal dari API. React Context hanya untuk dependensi lintas pohon (locale, audio engine, tier), bukan cache data.

---

## Scripts

| Lokasi | Script | Perintah | Fungsi |
|---|---|---|---|
| root | `dev` | `concurrently -n shared,web,api "npm run dev -w @rf/shared" "npm run dev -w @rf/web" "npm run dev -w @rf/api"` | Shared watch, Vite 5173, API 4000 |
| root | `build` | `npm run build -w @rf/shared && npm run build -w @rf/api && npm run build -w @rf/web && npm run prerender -w @rf/web` | Build produksi penuh |
| root | `typecheck` | `tsc -b --pretty` | Semua project reference |
| root | `lint` | `eslint .` | Flat config seluruh workspace |
| root | `test` | `npm run test -w @rf/web && npm run test -w @rf/api` | Vitest unit + Supertest |
| root | `test:e2e` | `playwright test -c e2e/playwright.config.ts` | Playwright terhadap build/preview |
| root | `db:migrate` | `npm run db:migrate -w @rf/api` | `prisma migrate dev` (lokal) |
| root | `db:seed` | `npm run db:seed -w @rf/api` | Seed idempotent |
| root | `prerender` | `npm run prerender -w @rf/web` | Menulis HTML per rute |
| root | `restore` | `npm run restore -w @rf/api --` | CLI restore file `.sql` (TD-13) |
| `@rf/web` | `dev` | `vite` | Dev server |
| `@rf/web` | `build` | `tsc -b && vite build && vite build --ssr src/entry-server.tsx --outDir dist/server` | Klien + SSR bundle untuk prerender |
| `@rf/web` | `prerender` | `node scripts/prerender.mjs` | Prerender semua rute publik |
| `@rf/web` | `typecheck` | `tsc -b --pretty` | Cek tipe |
| `@rf/web` | `lint` | `eslint src scripts` | Lint |
| `@rf/web` | `test` | `vitest run` | Unit/component test |
| `@rf/web` | `test:watch` | `vitest` | Mode watch |
| `@rf/api` | `dev` | `tsx watch src/server.ts` | API dev + reload |
| `@rf/api` | `build` | `tsc -b` | Emit `dist/` |
| `@rf/api` | `start` | `node dist/server.js` | Runtime container |
| `@rf/api` | `typecheck` | `tsc -b --pretty` | Cek tipe |
| `@rf/api` | `lint` | `eslint src prisma scripts` | Lint |
| `@rf/api` | `test` | `vitest run` | Unit + Supertest (DB uji) |
| `@rf/api` | `db:generate` | `prisma generate --schema prisma/schema.prisma` | Prisma Client |
| `@rf/api` | `db:migrate` | `prisma migrate dev --schema prisma/schema.prisma` | Migrasi lokal |
| `@rf/api` | `db:migrate:deploy` | `prisma migrate deploy --schema prisma/schema.prisma` | Migrasi produksi |
| `@rf/api` | `db:seed` | `tsx prisma/seed.ts` | Seed default |
| `@rf/api` | `restore` | `tsx scripts/restore.ts` | Restore via Railway Shell untuk file > 80 MB |
| `@rf/shared` | `dev` | `tsc -b -w` | Emit `dist` mode watch |
| `@rf/shared` | `build` | `tsc -b` | Build paket |
| `@rf/shared` | `typecheck` | `tsc -b --pretty` | Cek tipe |

Catatan:
- Script root memanggil workspace dengan `-w`; jangan menjalankan `prisma` dari root.
- `test:e2e` membutuhkan API + web berjalan (atau `playwright webServer` di konfigurasi).
- `db:migrate` tidak pernah dipakai di produksi; produksi hanya `db:migrate:deploy`.

---

## Environment Matrix

`apps/web/.env.example` hanya berisi `VITE_*`. `apps/api/.env.example` berisi seluruh variabel server. Salin ke `.env.local` (web) / `.env` (api); keduanya masuk `.gitignore`.

| Nama | Dipakai di | Wajib | Contoh | Catatan rahasia |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | web runtime + prerender | Ya | `http://localhost:4000/api/v1` | Publik. Termasuk prefix `/api/v1`; HTTPS di produksi |
| `VITE_SITE_URL` | web: canonical, OG, prerender | Ya | `http://localhost:5173` | Publik. Origin produksi tanpa trailing slash |
| `VITE_RECAPTCHA_SITE_KEY` | web contact | Ya jika contact aktif | `replace-with-recaptcha-v2-site-key` | Site key publik (v2 checkbox), bukan secret |
| `NODE_ENV` | api | Ya | `development` | `production` mengaktifkan cookie `Secure` |
| `PORT` | api | Tidak (default 4000) | `4000` | Railway menyuntikkan `PORT` |
| `TRUST_PROXY` | api | Tidak (default 1) | `1` | Railway reverse proxy; rate limit per IP |
| `LOG_LEVEL` | api | Tidak (default `info`) | `info` | Level pino |
| `DATABASE_URL` | api, Prisma, `pg_dump`/`psql` | Ya | `postgresql://rf:change-me@localhost:5432/rf?schema=public` | **Rahasia**; produksi `sslmode=require` |
| `SESSION_SECRET` | api | Ya | `replace-with-32-byte-random-hex` | **Rahasia**; HMAC `reauthToken` 5 menit untuk restore. Cookie `rf_sess` tetap acak + SHA-256 (TD-06) |
| `FRONTEND_ORIGIN` | api: CORS + CSRF allowlist | Ya | `http://localhost:5173` | Origin persis, tanpa trailing slash; beberapa origin dipisah koma bila perlu |
| `ADMIN_USERNAME` | seed | Tidak | `rf-admin` | Hanya seed awal; hapus setelah Admin dibuat |
| `ADMIN_PASSWORD` | seed | Tidak | `replace-with-strong-password` | **Rahasia**; hanya seed awal |
| `CLOUDINARY_CLOUD_NAME` | api | Ya | `replace-with-cloud-name` | Terlihat di URL media; tetap konfigurasi server |
| `CLOUDINARY_API_KEY` | api | Ya | `replace-with-api-key` | Semi-rahasia |
| `CLOUDINARY_API_SECRET` | api | Ya | `replace-with-api-secret` | **Rahasia**; tidak pernah ke browser |
| `MAIL_HOST` | api | Ya | `smtp.resend.com` | Default Resend (TD-12) |
| `MAIL_PORT` | api | Ya | `465` | TLS |
| `MAIL_USER` | api | Ya | `resend` | — |
| `MAIL_PASSWORD` | api | Ya | `replace-with-smtp-password` | **Rahasia** |
| `MAIL_FROM` | api | Ya | `no-reply@example.com` | Domain wajib SPF + DKIM |
| `ADMIN_EMAIL` | api contact + seed | Ya | `admin@example.com` | Penerima; PII, bukan secret |
| `RECAPTCHA_SECRET_KEY` | api | Ya | `replace-with-recaptcha-secret-key` | **Rahasia** |
| `DEEPL_API_KEY` | api | Ya | `replace-with-deepl-key` | **Rahasia** |
| `DEEPL_API_URL` | api | Ya | `https://api-free.deepl.com/v2/translate` | Endpoint Free |
| `VERCEL_DEPLOY_HOOK_URL` | api deploy-hook | Ya di produksi | `https://api.vercel.com/v1/integrations/deploy/...` | **Rahasia** (capability URL) |

Aturan:
- Hanya variabel `VITE_*` yang diekspos Vite ke browser. Variabel lain di `apps/web` akan diabaikan dan tidak boleh dipakai.
- `SESSION_SECRET` menandatangani `reauthToken` HMAC 5 menit; cookie sesi tetap token acak + SHA-256 (TD-06).
- `ADMIN_USERNAME`/`ADMIN_PASSWORD` hanya dibaca `prisma/seed.ts`, bukan runtime API. Seed idempotent tidak menimpa Admin yang sudah ada.
- Tidak ada nilai secret nyata di `.env.example`, dokumen, atau repo.

---

## Build & Deploy

### Vercel — `apps/web`

| Pengaturan | Nilai |
|---|---|
| Root Directory | `apps/web` |
| Framework | Vite |
| Node | 22 |
| Include files outside root | Aktif (workspace `packages/shared`) |
| Install Command | `cd ../.. && npm ci` |
| Build Command | `cd ../.. && npm run typecheck -w @rf/web && npm run build -w @rf/web && npm run prerender -w @rf/web` |
| Output Directory | `dist` |

Urutan:
1. `npm ci` di root workspace.
2. `tsc -b` untuk `@rf/web` + `@rf/shared`.
3. `vite build` menghasilkan aset klien.
4. `vite build --ssr src/entry-server.tsx --outDir dist/server` menghasilkan renderer.
5. `scripts/prerender.mjs`:
   - Mengambil manifest rute statis + semua item publik dari API (`VITE_API_BASE_URL`).
   - Merender tiap rute dengan `entry-server.tsx`, menyisipkan HTML, title, meta, canonical, `hreflang`, OG, JSON-LD.
   - Menulis `dist/<route>/index.html`; rute dinamis yang gagal diambil tetap ditulis sebagai shell CSR.
   - API tidak tersedia → shell CSR, **build tidak gagal** (TD-11).
   - Menghapus `dist/server` setelah selesai.
6. Output `dist/` diunggah. `vercel.json`:
   - `/sitemap.xml` dan `/robots.txt` → origin API (cache 1 jam).
   - Fallback rute tak dikenal → `/index.html`; aset statis dilayani lebih dulu.
7. `VITE_*` diisi di Environment Vercel. Tidak ada secret build.

Deploy API lebih dulu daripada web agar prerender mendapat data. Bila dibalik, build tetap sukses tetapi snapshot SEO kosong sampai Deploy Hook berikutnya.

### Railway — `apps/api` + Dockerfile

Dockerfile multi-stage:

| Stage | Isi |
|---|---|
| `deps` | `node:22-alpine`; salin manifest root + workspace; `npm ci` |
| `build` | salin source; `prisma generate`; `tsc -b` untuk `@rf/shared` + `@rf/api` |
| `runtime` | `node:22-alpine`; `apk add --no-cache postgresql17-client` (TD-13); user non-root `rf` (uid 1001); salin `dist` api, `dist` shared, `prisma/`, `node_modules` produksi; `USER rf`; `EXPOSE 4000` |

Ketentuan image:
- `pg_dump`/`psql` versi 17 tersedia di PATH; kompatibel dengan PostgreSQL 16 (TD-13).
- `prisma` CLI harus tersedia di runtime untuk `migrate deploy` (taruh di `dependencies`, bukan `devDependencies`).
- Tidak berjalan sebagai root. File yang ditulis saat runtime hanya di `/tmp` (snapshot restore).
- `HEALTHCHECK` memanggil `http://127.0.0.1:${PORT}/api/v1/health`; interval 30 dtk, timeout 5 dtk, retries 3, start period 30 dtk.

Healthcheck:
- `GET /api/v1/health` → `200 { "database": "ONLINE" | "OFFLINE", "checkedAt": "..." }`.
- Selalu `200` selama proses hidup; DB OFFLINE dilaporkan di body (api-spec), bukan `503`. Railway memakai endpoint ini untuk liveness proses, bukan kesiapan DB.
- Tanpa auth, tanpa cache (`no-store`), dikecualikan dari log akses sukses.
- Railway healthcheck path: `/api/v1/health`.

Migration saat deploy:
1. Railway Pre-Deploy Command: `npm run db:migrate:deploy -w @rf/api` (konteks repo) atau `npm run db:migrate:deploy` (konteks `apps/api`).
2. Migrasi gagal → deploy dibatalkan; container lama tetap hidup.
3. Start Command: `node dist/server.js`.
4. Seed **tidak** otomatis. Jalankan sekali via Railway Shell: `npm run db:seed -w @rf/api` dengan `ADMIN_USERNAME`/`ADMIN_PASSWORD` diset.
5. Tidak pernah memakai `prisma db push` di produksi. Migrasi destruktif wajib didahului backup manual.

Deploy hook:
- `jobs/deploy-hook.ts` dipanggil setelah mutasi CMS sukses (create/update/delete koleksi, kategori, proyek, social media, learning journey, devices, timeline, profil, CV, metadata media).
- Debounce 5 menit; panggilan beruntun digabung menjadi satu `POST VERCEL_DEPLOY_HOOK_URL`.
- Fire-and-forget: respons mutasi tidak menunggu hook; kegagalan hanya dicatat pino. Tidak ada retry berantai.
- Tidak dipicu oleh read, `POST /visits`, contact, atau translate.
- Timer di memori; restart container membatalkan jadwal yang belum terkirim.

Prasyarat domain (TD-06): `rf.<domain>` → Vercel, `api.rf.<domain>` → Railway. `*.vercel.app` + `*.railway.app` tidak memenuhi sesi persisten.

**Blocker konteks build.** Root Directory Railway `apps/api` membuat Docker build context hanya berisi `apps/api`, sehingga `packages/shared` tidak terlihat. Sebelum deploy, salah satu harus dipilih: (a) Root Directory repo + `build.dockerfilePath: apps/api/Dockerfile`; (b) publikasikan `@rf/shared` ke registry privat; (c) commit artefak `packages/shared/dist` (tidak direkomendasikan). Keputusan ini belum ada di TD.

---

## Alur Data Satu Request

Contoh: `GET /api/v1/collections/ai?limit=12&cursor=`

Backend:
1. Browser → DNS `api.rf.<domain>` → Railway (tidak lewat Vercel). `app.ts` menjalankan `request-id` → `pino-http` → `helmet` → `cors(FRONTEND_ORIGIN)` → `cookie-parser` → rate limit global → `express.json({ limit })`.
2. `modules/collections/routes.ts` mencocokkan `GET /api/v1/collections/:type`; tidak ada auth (publik).
3. `middleware/validate.ts` memvalidasi params + query dengan `collectionListQuerySchema` dari `@rf/shared`: `type` ∈ `ai|tools|websites`, `limit` default 12 (maks 48), `cursor` opsional, `categoryId` opsional.
4. `controller.ts` memanggil service; tidak ada Prisma dan tidak ada `try/catch` manual (diteruskan ke `next`).
5. `service.ts` memetakan `ai` → `CollectionType.AI`, menyusun `where`, urutan `nameSort ASC, id ASC` (TD-07), membaca cursor base64url `{ sortValue, id }`, dan menghitung `total` tanpa cursor.
6. `repository.ts` menjalankan query Prisma:
   - `findMany` dengan `include: { category, subcategory, logo, links }` dan `select` terbatas.
   - Cursor pagination; tidak ada `offset`. `nextCursor` dari item terakhir bila masih ada data.
7. `serializer.ts` membentuk `CollectionItemDto`: `id`, `type`, `name`, `description`, `usageStatus`, `sourceLocale`, `createdAt`, kategori/subkategori, logo (URL `f_auto,q_auto`), links terurut. `nameSort`, `publicId`, dan field internal dibuang.
8. Response `200 { "items": [...], "nextCursor": "<opaque>|null", "total": 24 }`, dengan `Cache-Control: public, max-age=60, stale-while-revalidate=300` (api-spec). `pino-http` mencatat request id, status, durasi. Error lewat `middleware/error.ts` → `{ "error": { "code", "message", "details": { "requestId" } } }`, tanpa stack/SQL.
9. Kesegaran runtime tetap ditangani TanStack Query; header cache hanya untuk edge/browser sesuai api-spec.

Frontend:
1. `routes/ai.tsx` loader memanggil `queryClient.ensureQueryData(collectionListQuery({ type: 'ai', cursor: null }))` untuk halaman pertama. Loader hanya prefetch; tidak menyimpan state sendiri.
2. Komponen `CollectionPage` memakai `useInfiniteQuery` dengan key yang sama: `['collections', 'ai', { cursor, categoryId }]`. Cache loader langsung dipakai; tidak ada request ganda.
3. `getNextPageParam` mengembalikan `nextCursor`; tombol Load More menambah 12 item (TD-08) dan mempertahankan fokus.
4. Loading → skeleton; error → `ErrorPanel` + retry (`refetch`); empty → `EmptyState`. Status loading/error selalu berasal dari TanStack Query.
5. Navigasi ke `/ai/:id` memakai `GET /api/v1/collections/:type/:id`; response memuat `prevId`/`nextId` dalam kategori yang sama, urutan `nameSort, id` (api-spec).

Aturan loader vs query:

| Kebutuhan | Mekanisme |
|---|---|
| Guard sesi admin | Loader `routes/admin/layout.tsx`: `ensureQueryData(['admin','session'])`; 401 → redirect `/admin/login` |
| Prefetch halaman publik pertama | Loader `ensureQueryData` dengan key yang sama |
| Data, loading, error, retry, mutation | TanStack Query di komponen |
| Prerender | `entry-server.tsx` + `queryClient.fetchQuery`; bukan loader |
| Mutasi admin | `useMutation`; invalidate key domain + overview; tidak melalui loader |

Loader tidak boleh memakai key berbeda dari komponen, dan tidak boleh menelan error menjadi data kosong. Error loader publik jatuh ke error boundary rute; error admin 401 selalu redirect.

---

## Urutan Implementasi

| Phase | Fokus | Folder / file yang dibuat | Exit criteria |
|---|---|---|---|
| 1 | Foundation | Root: `package.json`, `tsconfig*`, eslint, prettier, `.gitignore`, `.editorconfig`, `README`. `packages/shared/*`. Pindahkan `prisma/` → `apps/api/prisma/`. API: `app.ts`, `server.ts`, `config/env.ts`, `lib/prisma.ts`, `lib/logger.ts`, `lib/session.ts`, `middleware/*`, `modules/auth/*`, `modules/health/*`, `types/express.d.ts`. Web: `index.html`, `entry-client.tsx`, `routes/router.tsx`, `routes/root.tsx`, `lib/api-client.ts`, `lib/query-client.ts`, `styles/*`. | `npm run typecheck`, `npm test`, `/api/v1/health` 200, login admin + cookie `rf_sess`, logout revoke |
| 2 | Admin CMS | API: `modules/profile|categories|collections|projects|social-media|learning-journey|devices|timeline|resume|media|overview`. Web: `routes/admin/*`, `components/admin/*`, `features/media/*`, `routes/admin/layout.tsx`. | RF-013 s/d RF-017, RF-026; CRUD langsung publik; media reuse; hapus media 409 |
| 3 | Public Website | API: `modules/statistics`. Web: semua `routes/*` publik, `components/public/*`, `components/layout/*`, `features/collections/*`, `features/presence/*` (footer). | RF-001 s/d RF-009, RF-019 (tema dasar), RF-023, RF-024, RF-029 |
| 4 | Interaction & Experience | `features/search/*`, `features/theme/*`, `features/audio/*`, `features/i18n/*`, `stores/*`, `hooks/*`, `lib/motion-tier.ts`, `lib/seo.ts`, `entry-server.tsx`, `scripts/prerender.mjs`. API: `modules/translate`, `modules/search`. | RF-010, RF-011, RF-019 s/d RF-022, RF-030; prerender sukses |
| 5 | Infrastructure & Security | API: `modules/visits`, `modules/contact`, `modules/backup`, `modules/presence` (lokasi + heartbeat), perketat `middleware/rate-limit.ts` + `csrf.ts`, `lib/cloudinary.ts`, `lib/mailer.ts`, `lib/recaptcha.ts`, `lib/backup.ts`, `jobs/deploy-hook.ts`, `sitemap`/`robots` di `app.ts`, `Dockerfile`, `scripts/restore.ts`. | RF-018, RF-024 s/d RF-028; backup + restore drill; deploy hook |
| 6 | Testing & Production | `e2e/**`, `vitest.config.ts` final, seed uji, domain `rf.<domain>` + `api.rf.<domain>`, deploy Vercel + Railway, verifikasi healthcheck/migrasi. | Semua acceptance; RF-030; tidak ada secret di bundle web |

Aturan fase:
- Phase 1 tidak boleh menambah fitur di luar fondasi. Schema Prisma dipindah lebih dulu agar semua script menunjuk satu lokasi.
- Setiap phase diakhiri `typecheck`, `lint`, dan test terkait. Phase 6 tidak memperbaiki arsitektur.
- **Tech Stack menunggu model.** `docs/api-spec.md` menetapkan `GET /api/v1/tech-stack` + CRUD `/admin/tech-stack`, tetapi `prisma/schema.prisma` belum memiliki `TechStackItem`. Tambahkan model + migrasi sebelum modul `tech-stack` diimplementasikan. Wireframe belum memiliki layar admin Tech Stack; route `routes/admin/tech-stack.tsx` dibuat hanya setelah layar disetujui.
- **`docs/api-spec.md` adalah kontrak final.** Endpoint detail item (`GET /collections/:type/:id`), prev/next, statistik admin, health, dan restore sudah didefinisikan. Perubahan endpoint wajib memperbarui dokumen itu dan `@rf/shared`.

---

## Larangan

1. **Jangan impor kode API dari web.** `@rf/web` tidak boleh mengimpor `apps/api/**`, `@prisma/client`, `argon2`, `nodemailer`, atau `cloudinary`. Hanya `@rf/shared`.
2. **Jangan simpan token di `localStorage`/`sessionStorage`.** Sesi admin hanya cookie `rf_sess` HttpOnly. Tidak ada access token di state, URL, atau log.
3. **Jangan query Prisma di route/controller.** Hanya `modules/*/repository.ts` dan `lib/prisma.ts`. Controller tidak memanggil `prisma`.
4. **Jangan hardcode konten CMS.** Item, kategori, subkategori, proyek, timeline, perangkat, media, profil, dan CV berasal dari database. Pengecualian: deskripsi visual Category Header ditulis di kode (blueprint §4.4) dan kamus UI di `src/i18n/`.
5. **Jangan taruh secret di `VITE_*`.** Apa pun yang berprefiks `VITE_` masuk bundle publik. Secret hanya di environment `apps/api`.
6. **Jangan hapus aset Cloudinary.** Aplikasi tidak memanggil Cloudinary Destroy; hapus media = hapus row DB bila tidak direferensikan (TD-09).
7. **Jangan `prisma db push` di produksi.** Hanya `prisma migrate deploy`; migrasi destruktif didahului backup.
8. **Jangan menambah field/endpoint tanpa shared schema.** Setiap perubahan kontrak API memperbarui `packages/shared/src/schemas/*` dan `docs/api-spec.md`.
9. **Jangan commit `dist/`, `node_modules/`, `.env`, atau file backup `.sql`.**
10. **Jangan memakai `localStorage` untuk state yang sudah ditetapkan sessionStorage/memori.** Tema = sessionStorage; sidebar = memori; audio volume/mute = localStorage (TD-05).
11. **Jangan membuat endpoint tulis presence pengunjung.** Hanya heartbeat admin (TD-02).
12. **Jangan menjadikan prerender sebagai sumber kebenaran data.** Runtime tetap dari API; snapshot SEO boleh tertinggal ≤ ±10 menit (TD-11).

---

## Catatan Konsistensi Dokumen

- `docs/erd.md` masih menyebut `prisma/schema.prisma`; setelah Phase 1 path efektif `apps/api/prisma/schema.prisma`.
- `docs/ui-wireframe-spec.md` §12 memuat asumsi desain yang belum diputuskan (tema reload, persistensi bahasa, rute admin, endpoint detail, Tech Stack, Privacy Policy, email config). Struktur ini mengikuti asumsi yang tercantum, bukan memutuskan ulang.
- Konflik yang tidak terselesaikan oleh blueprint/TD harus dicatat sebagai keputusan baru sebelum implementasi terkait.





