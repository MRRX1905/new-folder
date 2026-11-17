# RF Personal Tech Dashboard

Personal technology showcase and interactive dashboard. Product and technical contracts live in
[`docs/`](docs/); the binding technical decisions are in
[`docs/technical-decisions.md`](docs/technical-decisions.md).

## Stack

- **Monorepo:** npm workspaces — `apps/web`, `apps/api`, `packages/shared`
- **Web:** React 19, Vite 6, TypeScript, React Router 7, TanStack Query, Zustand, Tailwind CSS v4
- **API:** Express 5, TypeScript, Prisma 6, PostgreSQL 16, Argon2id sessions, Zod
- **Shared:** Zod schemas, error codes, limits and session constants consumed by both sides

## Setup

```bash
npm install
npm run db:generate -w @rf/api
```

Copy the environment templates and fill in real values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Create the database schema and seed default categories:

```bash
npm run db:migrate -w @rf/api    # local development
npm run db:seed -w @rf/api       # requires ADMIN_USERNAME / ADMIN_PASSWORD for the first admin
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Shared watch + API (`4000`) + web (`5173`) |
| `npm run build` | Build shared, API and web |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run lint` | ESLint across the monorepo |
| `npm test` | API and web unit tests |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Idempotent seed |

## Implemented (Phase 1 — Foundation)

- npm workspace structure, shared contract package, strict TypeScript and lint setup
- Prisma schema moved to `apps/api/prisma` with an initial migration and idempotent seed
- Express API foundation: env validation, request ids, CORS, CSRF (Origin allowlist +
  `X-RF-Client`), JSON size limits, rate limiter, error envelope, Prisma singleton, health probe
- Admin authentication: login/logout/session/credential update/re-auth, Argon2id, persistent
  `rf_sess` cookie, sliding 30-day expiry with hourly rotation, 90-day absolute cap, login
  throttling and lockout
- Web shell: welcome screen, workspace launcher, sidebar + mobile drawer, five theme palettes,
  ID/EN UI dictionary, footer database status, admin login, guarded admin layout and overview
- Public section routes are scaffolded placeholders; their modules arrive in later phases

## Notes

- `apps/api/prisma/schema.prisma` is the only Prisma schema. Do not recreate `prisma/` at the root.
- Secrets belong only in `apps/api/.env`. The web app may only receive `VITE_*` values.
- Session cookies require the same registrable domain in production (`rf.<domain>` +
  `api.rf.<domain>`), per TD-06.
