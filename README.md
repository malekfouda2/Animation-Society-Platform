# Animation Society Platform

Bilingual (Arabic/English) website and membership platform for the Animation Society (جمعية الرسوم المتحركة), Saudi Arabia. Custom MERN application: Next.js (React) renders, Express owns the API and business rules, MongoDB stores data.

Status: Stage 1 (foundation and bilingual shell) is complete, and the public-site design is awaiting review. Membership, payments and the member portal come in later stages. See docs/PROGRESS.md.

## Quick start

Requires Node 24 (`.nvmrc`), npm 11 and Docker.

```bash
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:up      # local MongoDB 8.0 single-node replica set
npm run dev        # API on 127.0.0.1:4100, web on http://localhost:3100
npm run check      # lint, typecheck, unit tests, build
```

Full setup, environment variables and commands: docs/DEVELOPMENT.md.

**English brand font.** RNS Sanz is not in the repository because its web licence is not yet confirmed. To use it locally, place `RNSSanz-Medium.otf`, `RNSSanz-SemiBold.otf`, `RNSSanz-Bold.otf` and `RNSSanz-ExtraBold.otf` from the Society Drive in `apps/web/public/fonts/rns-sanz/` (git-ignored). Without them, English text falls back to Cairo.

## Repository layout

- `apps/web`: Next.js 16 App Router, `/ar` (RTL, default) and `/en` (LTR).
- `apps/api`: Express 5 API under `/api/v1`, Mongoose 9.
- `packages/contracts`: shared zod schemas and types (no models or secrets).
- `docs/`: scope, architecture, plan, decisions, acceptance checks, design brief, brand assets, artwork replacement guide and the session-by-session progress log.
- `prompts/`: stage prompts for Claude Code. `CLAUDE.md` holds standing project instructions.

Commercial and contract terms are kept outside this public repository.
