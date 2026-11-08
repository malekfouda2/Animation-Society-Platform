# Local development

Verified on 2 November 2026: macOS (Darwin 24.6), Node 24.4.0, npm 11.4.2, Docker 28.3.0.

## Prerequisites

- Node 24 (`.nvmrc`) and npm 11.
- Docker Desktop running (local MongoDB replica set).

## First run

```sh
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up        # MongoDB 8.0 single-node replica set rs0 on 127.0.0.1:27017, waits until PRIMARY
npm run dev          # API on http://127.0.0.1:4100, web on http://localhost:3100
```

Open http://localhost:3100. It redirects to `/ar` or `/en` using Accept-Language (Arabic by default). `/ar/admin` shows live API and database readiness.

Ports 3100/4100 were chosen because 3000 and 127.0.0.1:4000 were already in use by other projects on the development machine. The API binds an explicit host (`API_HOST`, default 127.0.0.1) so a port collision fails loudly.

## Commands (repository root)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build contracts, then run API (tsx watch) and web (Next dev) together |
| `npm run dev:api` / `npm run dev:web` | Run one side only |
| `npm run lint` | ESLint in every workspace |
| `npm run typecheck` | Strict `tsc --noEmit` in every workspace (web runs `next typegen` first) |
| `npm test` | Unit tests (Vitest) in every workspace; no database needed |
| `npm run test:integration` | API tests against the real local replica set (`npm run db:up` first); uses a throwaway `animation_society_it` database that it drops afterward |
| `npm run build` | contracts → api (`tsc`) → web (`next build`) |
| `npm run check` | lint + typecheck + test + build (what CI runs) |
| `npm run db:up` / `db:down` / `db:logs` | Local MongoDB lifecycle (`db:down` keeps the data volume) |

Single test file: `npm test -w @as/api -- test/health.test.ts`, or a single test by name: `npm test -w @as/api -- -t "standalone"`. Use `-w @as/web` or `-w @as/contracts` for the other workspaces.

`next build` and `next dev` validate `API_INTERNAL_ORIGIN` and `PUBLIC_ORIGIN`; set them in the shell or `apps/web/.env.local`.

## Workspaces

| Package | Path | Notes |
| --- | --- | --- |
| `@as/contracts` | packages/contracts | Browser-safe zod schemas/types/constants. Compiled to `dist/`; root scripts build it first. Lint forbids `node:*`, mongoose and express imports. |
| `@as/api` | apps/api | Express 5 + Mongoose 9. `createApp(deps)` in `src/app.ts` is dependency-injected for tests; `src/server.ts` loads env, connects Mongo and listens. Features live in `src/features/<name>/`. |
| `@as/web` | apps/web | Next.js 16 App Router. `src/proxy.ts` (Next 16's replacement for middleware) only redirects to a locale. `/api/v1/*` is rewritten to the API in development. |

`apps/worker` from docs/ARCHITECTURE.md is not created yet; it arrives with the first durable job (email).

## Environment

API (`apps/api/.env`): `NODE_ENV`, `API_PORT`, `API_HOST`, `MONGODB_URI`, `PUBLIC_ORIGIN`, `LOG_LEVEL`, `PAYMENT_MODE`, `EMAIL_MODE`. Validation errors name variables, never values. With `NODE_ENV=production` the API refuses to start unless payment and email modes are `live` and `PUBLIC_ORIGIN` is https.

Web (`apps/web/.env.local`): `API_INTERNAL_ORIGIN` (server-side only) and `PUBLIC_ORIGIN`.

## Production topology (not yet deployed)

One public origin behind a reverse proxy: `/api/v1/*` goes to Express, everything else to `next start`. Set `NODE_ENV=production`, use `API_HOST=0.0.0.0` only inside a private network or container, and use a replica-set MongoDB with backups. Hosting has not been chosen (DECISIONS D06).
