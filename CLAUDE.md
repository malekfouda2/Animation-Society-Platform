# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project instructions

Build the Animation Society website and membership MVP for Malek Fouda.

## Repository state

Stage 1 (foundation and bilingual shell) was implemented on 2 November 2026; git initialized on `main` with no remote (do not push without asking). The stage prompts are prompts/01-START.md (Stage 1 foundation), prompts/03-DESIGN-AND-ARTWORK.md (homepage/art-direction checkpoint) and prompts/02-CONTINUE.md (each later bounded task). docs/PROGRESS.md is the handoff between sessions; read it first to find the current stage.

## Commands

Full detail in docs/DEVELOPMENT.md. Node 24, npm workspaces, run from repo root:

- `npm run db:up`: start the local MongoDB 8.0 single-node replica set (Docker) and wait until it is PRIMARY.
- `npm run dev`: API on 127.0.0.1:4100 and web on localhost:3100. Ports 3000 and 4000 are taken by other projects on this machine.
- `npm run check`: lint, typecheck, unit tests and build (same as CI).
- `npm run test:integration`: API tests against the real replica set.
- Single test: `npm test -w @as/api -- test/health.test.ts` or `-- -t "name"`.

`@as/contracts` compiles to `dist/`, and root scripts build it first. If you run a workspace script directly, run `npm run build:contracts` first. Pinned versions: TypeScript 6.0.3 (typescript-eslint 8.72 does not support 7.x), ESLint 10.13.0 (no eslint-config-next; see DECISIONS), minimatch forced to 11.0.4 via overrides, Next 16.4.4, React 19.3.1, Express 5.3.0, Mongoose 9.11.4, zod 4.6.7, Vitest 5.1.0.

## Planned architecture (docs/ARCHITECTURE.md)

- One repo, npm workspaces, single lockfile: `apps/web` (Next.js, `/ar` and `/en` route prefixes), `apps/api` (Express, `/api/v1`), `apps/worker` (not created yet: Mongo-backed durable jobs/reminders that reuse API services), `packages/contracts` (shared schemas/types; must never import models or secrets).
- API: `createApp(deps)` in `apps/api/src/app.ts` takes injected dependencies so tests use supertest without a database. Features live in `src/features/<name>/`. Throw `HttpError(code, …)` and the central handler returns `{ error: { code, message, requestId, fields? } }`. Env is validated in `src/config/env.ts`.
- Web: Next 16 uses `src/proxy.ts` (the old middleware); it only redirects to a locale. Interface strings are in `src/i18n/dictionaries/{ar,en}.ts`, typed by `Dictionary`, so a missing key fails typecheck. Pages resolve the locale via `resolveLocale(params)`. Styling uses only the CSS variables in `src/styles/tokens.css` (Society brand; the public site renders inside `.world`, a dark "night studio" token scope) and logical properties. Public motion runs through `components/motion/MotionEngine.tsx` (`data-speed`, `data-depth`, `data-progress`).
- Web and API share one origin behind a reverse proxy, with a matching proxy in development. Only the API touches MongoDB or changes domain state; Next.js only renders. Never cache member/admin/verification responses.
- Three separate state machines: application review (draft → submitted ⇄ needs_changes; submitted → approved/rejected), payment order (created → pending → succeeded/failed/canceled, where a stale failure never overwrites a reconciled success), and membership entitlement (`membershipPeriods`, with suspension tracked separately from dates). Approval ≠ payment ≠ entitlement.
- Payment fulfillment pipeline: verify provider signature (keep raw body) → validate order/amount/currency/account → dedupe event by unique key → in one MongoDB transaction record payment, create exactly one period (unique on fulfillment source) and enqueue email job → acknowledge. Provider adapter interface: `createCheckout`, `verifyEvent`, `getPaymentStatus`. Mock adapter is development-only and rejected in production.
- Date logic uses an injectable clock and UTC storage. Expiry is computed at request time, not only by the worker.
- Artwork lives outside page logic: a typed manifest (proposed `apps/web/src/config/artwork.ts`) plus `apps/web/public/artwork/`, documented in docs/ARTWORK_REPLACEMENT.md.
- Business values still unknown (plans, prices, gateway, renewal rules, QR fields, and others) are tracked as D01–D12 in docs/DECISIONS.md. Draft-contract SAR prices are provisional and must not be seeded as real. Acceptance IDs A01–A30 and D-A01–D-A09 in docs/ACCEPTANCE.md start NOT RUN; update them only with evidence.

## Read before work

Read docs/SCOPE.md, docs/DESIGN_BRIEF.md, docs/ARCHITECTURE.md, docs/DECISIONS.md, docs/PLAN.md, docs/ACCEPTANCE.md and docs/PROGRESS.md. Inspect the existing repository before scaffolding. Preserve existing work; do not initialize over or discard it.

## Product boundaries

- Custom MERN application. MongoDB, Express, React and Node.js are required. No WordPress or replacement backend/database platform.
- Arabic and English from the first usable screen, including public pages, admin, member portal, forms and essential emails. Proper RTL/LTR and accessible interactions.
- Next.js is the proposed React rendering layer; Express owns authentication, authorization, membership, payments and all other business rules.
- Deliver the reduced website/membership scope. Do not implement future-phase modules merely because an earlier document describes them.
- Recurring billing is conditionally included in the current fee if required and supported by the selected gateway. It is an unresolved product decision, not a permanently excluded feature.
- The latest user instructions guide engineering. Report conflicts with any subsequently supplied signed contract to Malek; do not decide contractual precedence yourself.

## Working method

Implement one stage from docs/PLAN.md at a time. Finish a real vertical slice with persistent data, access controls, relevant checks and working UI before calling it complete. Stop after the requested stage and report evidence and the next step.

For each task: state the scope briefly, implement, run relevant checks, inspect affected UI, and update docs/PROGRESS.md. Record package/runtime versions after verifying compatibility. Do not claim tests passed unless actually run. Distinguish mock, sandbox and live integrations.

Use strict TypeScript and clear feature modules. Keep controllers thin. Validate all input on the server. Share safe validation/contracts without importing backend models or secrets into frontend bundles. Prefer a modular monolith; no microservices, general workflow engine or speculative integration framework.

Make reversible local decisions without blocking unnecessarily. Record assumptions. When business rules are unknown, implement the independent scaffolding with synthetic data and list the specific decision needed. Do not invent provider capabilities, finalized prices, approved translations or Society policies.

## Security and correctness

Authorize every protected API request and private-file read on the server. A hidden button is not access control. Members see their own records; editors manage public content, not members/payments/roles. Administrator MFA must be implemented before launch, with recovery and enrollment rules.

Use secure, HttpOnly cookies and server-side sessions with CSRF protection appropriate to the chosen topology. Never store session credentials in browser localStorage. Use maintained password hashing and session libraries. Rate-limit sensitive endpoints and keep secrets out of logs and repositories.

Payment redirects never prove payment. Verify provider events, amount, currency and record association. Process payment events idempotently and atomically so retries cannot issue multiple membership periods. Production must reject mock payment/email modes. No card number/CVV storage.

Use stable entity IDs. Keep application review, payment state and membership entitlement distinct. Preserve payment/history records and log material administrative changes. Do not accept client-supplied prices or entitlement dates.

Use synthetic data locally. Do not expose real member data, credentials, private files or payment payloads to unapproved tools. No paid service purchase, live charge, production deployment, real-user email, data migration or destructive command without explicit authorization for that action.

## UI and content

Follow docs/DESIGN_BRIEF.md for every interface. Discover and use available frontend-design AND UI/UX skills before design work; report unavailable skills rather than claiming use. The public site must feel artistic, animation-specific, expressive and interactive, never like a generic generated template. Member/admin tasks must remain clear and efficient.

Use the Society Drive assets as the source for logos, visual identity and membership-card templates. The Drive was supplied and inventoried on 3 November 2026 (docs/BRAND_ASSETS.md); originals stay in the git-ignored `brand-source/`. Malek's logo is not the Society's brand. Missing access permits clearly labeled provisional exploration and independent engineering, not final brand approval. Use cinemaassoc.com for concepts and visitor journeys only, never as a visual template.

Create original temporary artworks and animation elements using available generation tools or SVG/CSS. Deliver actual editable/replaceable assets, keep a typed asset manifest and a replacement guide, and record provenance and approval status. Honor reduced motion, touch/keyboard use, Arabic/English design and media performance. Do not invent client productions or claim generated art is approved Society work.

Use translation keys and CSS logical properties. Store editorial Arabic/English content separately. Arabic text must shape correctly in PDFs as well as browsers. Include loading, empty, validation, success and failure states. Do not present demo content or simulated payment success as live functionality.

## Completion

Record changes, actual verification commands/results, known limitations and unresolved decisions. Update docs/PROGRESS.md after each stage. Never call an integration or feature production-ready solely because its UI exists.
