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

Open http://localhost:3100. It redirects to `/ar` or `/en` using Accept-Language (Arabic by default).

After copying `.env.example`, set `MFA_ENCRYPTION_KEY` in `apps/api/.env` (`openssl rand -base64 32`).

### Accounts in development

- Members sign up at `/en/register`. Emails are not sent anywhere in development (`EMAIL_MODE=mock`): they are stored in the `emails` collection and shown at **`/en/dev/inbox`** (or `/ar/dev/inbox`), where the confirmation and reset links can be clicked. That page and its API route do not exist in production or with any other email mode.
- Staff accounts are never created from the browser. Invite one from the shell; the invitation (a link to choose a password) lands in the local inbox:

  ```sh
  npm run staff -w @as/api -- invite --email admin@example.test --name "Synthetic Admin" --role admin --locale ar
  npm run staff -w @as/api -- reset-mfa --email admin@example.test --reason "Lost phone; identity checked by …"
  npm run staff -w @as/api -- disable --email someone@example.test --reason "Left the Society"
  ```

  In production use `npm run staff:prod -w @as/api -- …` (runs the built `dist/cli/staff.js`). Every command is recorded in the activity log.
- Staff (admin and editor) must set up an authenticator app at their first sign-in and enter a code at every sign-in after that. Use synthetic accounts and any authenticator app; ten one-time recovery codes are shown once.

### Content in development

- Public news and events, projects and partners live in MongoDB (`contentEntries`) and are edited by staff at `/en/admin/content/posts`, `/projects` and `/partners`. Public pages read only published copies from `GET /api/v1/content/:kind`; a fresh database shows the pages' empty states.
- Fixed page sections (homepage opening, About, vision and mission, goals, General Assembly, board, the five policies) are edited at `/en/admin/content/sections`. A section that isn't published shows the "awaiting content" state.
- Load the content that existed before publishing (the Motion Analysis Challenges project and the hero, About, vision, goals and General Assembly sections, with their earlier "awaiting sign-off" notes) with `npm run content -w @as/api -- seed` (`content:prod` in production). It skips anything already present and adds no news, events, partners, board members or policies.
- Uploaded images are re-encoded to WebP (metadata stripped, longest side at most 2400 px) and stored in `MEDIA_DIR` (`apps/api/var/media` in development, git-ignored). They're served at `/api/v1/media/:id`: to anyone once a published entry uses them, otherwise to signed-in staff only. Staff see and clean up all uploads at `/en/admin/media`; `npm run media -w @as/api -- prune --dry-run` lists unused uploads older than 24 hours, and without `--dry-run` deletes them (`media:prod` in production; schedule it daily).
- Contact-form messages are stored and, when `CONTACT_INBOX` is set, forwarded through the email outbox. In development `.env.example` sets a synthetic `society-inbox@example.test`, so they appear in the local inbox.

### Introduction films (not in the repository)

The homepage films and their posters (`apps/web/public/video/intro-{ar,en}.mp4` and `intro-{ar,en}-poster.webp`, about 34 MB) are git-ignored and must be copied in by hand on every checkout and server. Without them the video section's player and poster are empty. Re-create them from the Society Drive originals with the settings in docs/ARTWORK_REPLACEMENT.md ("Introduction films"). Production needs them deployed alongside the build or served from storage.

Ports 3100/4100 were chosen because 3000 and 127.0.0.1:4000 were already in use by other projects on the development machine. The API binds an explicit host (`API_HOST`, default 127.0.0.1) so a port collision fails loudly.

## Commands (repository root)

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build contracts, then run API (tsx watch) and web (Next dev) together |
| `npm run dev:api` / `npm run dev:web` | Run one side only |
| `npm run lint` | ESLint in every workspace |
| `npm run typecheck` | Strict `tsc --noEmit` in every workspace (web runs `next typegen` first) |
| `npm test` | Unit tests (Vitest) in every workspace; no database needed |
| `npm run test:integration` | API tests against the real local replica set (`npm run db:up` first): transactions plus accounts, sessions and two-step sign-in. Each test file uses its own throwaway `animation_society_it*` database. CI runs them too. |
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

`apps/worker` from docs/ARCHITECTURE.md is not created yet. Account emails are written to the `emails` outbox inside the same transaction as the change that causes them, then delivered; a failed delivery stays `pending` for the worker's retry once it exists (Stage 5).

## Environment

API (`apps/api/.env`): `NODE_ENV`, `API_PORT`, `API_HOST`, `MONGODB_URI`, `PUBLIC_ORIGIN`, `LOG_LEVEL`, `PAYMENT_MODE`, `EMAIL_MODE`, `CONTACT_INBOX` (Society mailbox for contact messages; empty stores them only), `MEDIA_DIR` (uploaded images; persistent storage outside the web app in production, included in backups), `MFA_ENCRYPTION_KEY` (32 random bytes, base64; encrypts staff authenticator secrets; each environment needs its own, kept out of the database and its backups). Validation errors name variables, never values. With `NODE_ENV=production` the API refuses to start unless payment and email modes are `live` and `PUBLIC_ORIGIN` is https.

Web (`apps/web/.env.local`): `API_INTERNAL_ORIGIN` (server-side only) and `PUBLIC_ORIGIN`.

## Production topology (not yet deployed)

One public origin behind a reverse proxy: `/api/v1/*` goes to Express, everything else to `next start`. Set `NODE_ENV=production`, use `API_HOST=0.0.0.0` only inside a private network or container, and use a replica-set MongoDB with backups. Hosting has not been chosen (DECISIONS D06).
