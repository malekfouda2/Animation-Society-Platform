# Proposed implementation architecture

## Deployment and repository

Use one repository and a modular monolith. Proposed directories:

- apps/web: React/Next.js UI, localized routes, public rendering and member/admin screens.
- apps/api: Express HTTP API, feature services, authorization, persistence and provider adapters.
- apps/worker: scheduled reminders and durable job processing, reusing backend services.
- packages/contracts: safe request/response schemas, validation and types.
- docs: scope, decisions, API documentation, runbooks and progress.

Use npm workspaces and a single lockfile. Pick supported compatible runtime/package versions at scaffolding and record them. No Kubernetes, microservices or Redis dependency by default. Add infrastructure only for a demonstrated need.

Expose the web app and /api/v1 through one production origin with a reverse proxy. Development should provide a matching proxy arrangement. Only the API talks to MongoDB or changes domain state. Next.js handles React rendering/routing, not a second independent business backend. SSR requests that need authentication must forward only the intended user's credentials safely; never share private cached responses. No caching of member/admin/private verification responses.

## UI and localization

Follow docs/DESIGN_BRIEF.md. Frontend and UI/UX skills guide interface work. Separate replaceable art/media from page logic using a typed asset manifest with localized alt text, crop/dimension metadata, motion/static variants and provenance. Keep motion wrappers reusable and reduced-motion aware. Preserve supplied card composition in the server-side PDF template.

Use /ar and /en route prefixes and preserve equivalent pages when switching languages. Set lang/dir at the document level. Use CSS logical properties. Translate labels, errors, navigation, email templates, status text and accessible names. Keep editorial language fields independent from interface dictionaries. Configure missing-translation behavior explicitly and show draft language gaps to editors rather than silently publishing empty content.

Public pages need crawlable rendered content, localized titles/descriptions and correct canonical/alternate-language links. Preview/admin/member pages must not appear in search indexing. Introduce shared form, table, status and layout primitives without creating a bespoke design-system project.

## Domain collections

| Collection | Main responsibility and constraints |
| --- | --- |
| users | Stable ID, normalized unique email, password hash, locale, role, verification and account state |
| sessions | Revocable opaque sessions, hashed token, user, expiry; expiration checked at request time |
| authTokens | Hashed, expiring, single-use verification/reset tokens with purpose |
| mfaCredentials | Protected TOTP secret, enrollment state and hashed single-use recovery codes |
| membershipPlans | Localized content, eligibility description, minor-unit price/currency, duration and enabled status |
| applications | User, plan snapshot, fixed answers, submitted/review states, reviewer and history |
| memberships | Stable member number, current entitlement, suspension state and card token version |
| membershipPeriods | Paid or explicitly staff-authorized periods, source payment and reason; append history |
| paymentOrders | Server-calculated amount/currency, purpose, user, plan/application snapshot, provider references |
| paymentEvents | Unique provider/event key, verified event metadata, processing outcome; minimal retained payload |
| subscriptions | Only if recurring required: provider reference, consent, cycle/cancellation and lifecycle state |
| contentPages | Fixed page key and localized editable sections |
| posts | Shared news/event content, category, publish state, localized slugs and external registration link |
| projectContent | Public initiative/project editorial entries; distinct from future project operations |
| partners | Names, public logo and approved website link |
| media | Owner, access classification, storage key, MIME/size and metadata |
| auditEvents | Append-only application-level record of material actions with actor/time/target |
| jobs | Durable email/reminder work with dedupe key, lease, attempts, retry time and final status |

Confirm exact schemas before implementation. Do not precreate future portfolio/task/evidence collections. Use bounded indexed queries, pagination and explicit uniqueness constraints. Avoid unbounded embedded event arrays. If IDs are ObjectIds internally, expose stable string representations and never use emails as foreign keys. Default single-organization design; multi-tenancy is future scope.

## State and payment correctness

Application review: draft -> submitted -> needs_changes -> submitted; submitted -> approved or rejected. Define whether rejected applications may reapply before adding a transition. Record actor/time/reason. Approval does not itself imply payment.

Payment order: created -> pending -> succeeded/failed/canceled, with provider-authoritative reconciliation for delayed/out-of-order events. A stale failure cannot overwrite a reconciled success. Do not assume receipt order equals business event order.

Membership: separate entitlement dates from administrative suspension/revocation. Compute expiry against the current time when serving protected content/cards, even if the scheduled worker is delayed. Renewing or paying does not automatically remove administrative suspension.

On payment confirmation:

1. Verify authenticity using the selected provider's documented method; retain raw request bytes if required for signature verification.
2. Resolve internal order and validate merchant/account association, amount, currency and payment ownership.
3. Insert/dedupe the provider event and validate legal state transitions.
4. Atomically record confirmed payment, create or extend exactly one entitlement period and enqueue the corresponding business email job. Use MongoDB transactions across related documents and unique constraints on fulfillment source.
5. A duplicate event/transaction yields the prior result, not another period. Distinct attempts for the same renewal must not fulfill it twice. Flag excess successful payments for reconciliation.
6. Acknowledge only after durable storage; recover processing from retryable failures and support provider-side status reconciliation.

Run local and CI MongoDB as a replica set where transaction behavior is tested. A standalone database is not an adequate substitute for these tests. The replica-set operational choice and backups must be accounted for in hosting.

Provider interfaces: createCheckout, verifyEvent, getPaymentStatus; recurring methods only when supported/required. Mock adapters are explicit development-only implementations; never pretend that they prove gateway acceptance. Live credentials stay server-side. Do not write a generic multi-gateway platform.

## Sessions, authorization and uploads

Use an opaque session cookie with HttpOnly, Secure in production and appropriate SameSite settings. Rotate on authentication and sensitive role changes; revoke after password reset or account disable. Validate CSRF/origin on state-changing browser requests. Do not apply browser CSRF middleware in place of authenticating gateway webhooks. Distinguish unauthenticated, forbidden and invalid-input responses without exposing internals.

Require MFA enrollment/verification for administrator access. Protect TOTP secrets with encryption separate from the database; recovery codes are hashed and single-use. Reauthentication is needed for sensitive actions. Avoid default production passwords and public admin seed routes.

Check ownership and role in Express for every member/payment/card/export operation. Whitelist update fields to prevent mass assignment. Validate rich text or use restricted structured content. CSV output must neutralize spreadsheet formula injection. External links must allow safe protocols.

Validate file size, detected type and image decoding; remove unnecessary metadata. Default member photos/files to private, authorized reads. Store files outside executable/public paths; use expiring scoped URLs where appropriate. QR public data is a separate explicitly limited projection, never a serialized user record.

## Jobs, cards and observability

Persist jobs before returning success for critical business events. Workers claim expiring leases atomically, retry with limits/backoff and expose failed work for investigation. Deduplicate reminder schedules per membership/period/reminder type. Email providers may not guarantee exactly-once sending; document that boundary and use provider idempotency if available.

Generate cards with a renderer that supports Arabic shaping and embedded licensed Arabic fonts. A controlled HTML-to-PDF template is a proposed approach; validate an actual Arabic name/photo/QR before committing to it. Never interpolate unsanitized member HTML or load arbitrary user URLs in a server-side browser. Record generated-card version and use revocable QR tokens.

Log request IDs and operational failures with sensitive fields redacted. Audit business decisions without storing passwords, session secrets or unnecessary payment data. Health/readiness endpoints should report service readiness without leaking credentials.

## Operations and future expansion

Staging uses separate secrets and synthetic/anonymized data. Back up database, necessary uploads and configuration recovery instructions to an approved independent destination. Agree retention/recovery targets; restore to an isolated environment and verify member/payment/file relationships. Replication is not a backup. Document deploy, rollback, database changes, secret rotation, administrator recovery and dependency updates.

Document /api/v1 endpoints with validation, permissions, error formats and pagination. Use provider adapters and clear modules for extensibility. Scaling may involve query/index changes, more web/API processes, a separate worker or managed storage/database services. Do not promise unlimited scale or future additions without engineering work.
