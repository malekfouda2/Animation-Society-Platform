# Implementation plan

The delivery schedule is relative to an agreed kickoff, not 2 November automatically. These engineering stages support that schedule; they are planning allocations, not proof of client acceptance.

## Stage 1 Foundation and bilingual shell

Inspect repository and read decisions plus docs/DESIGN_BRIEF.md. Discover frontend-design/UI-UX skills and inventory available Society assets; record the missing Drive URL if still absent. Scaffold TypeScript workspaces, React/Next web and Express API. Add local replica-set Mongo setup, validated environment configuration, health/readiness, lint/typecheck/build scripts and a basic CI definition. Add /ar and /en navigation, editable brand-token structure and public/member/admin layout shells. Apply inspected identity where available; otherwise keep the shell provisional and continue independent work. Use clearly marked synthetic content; no fake completed integrations.

Exit: documented clean startup; API readiness; both language layouts; missing-env handling; working scripts. Record versions and actual commands. No authentication/payment implementation in the first prompt.

## Stage 2 Identity and public publishing

Establish secure sessions, verification/reset, role checks and administrator MFA before protected admin publishing. Implement fixed content pages, post/project listings/details, partners, contact email adapter and editable bilingual content. Use frontend-design and UI/UX skills, create a distinctive homepage concept with original temporary artwork and motion, and approve visual direction through the agreed two design-review rounds. Inspect Society identity/card assets first if available. Build Arabic/English desktop/mobile versions; establish the art manifest and replacement guide before extending the direction to other pages.

Exit: persisted bilingual content, drafts protected, editor can publish authorized content but cannot access members/payments; public templates usable at mobile/tablet/desktop widths. Show demo email delivery only to a local inbox until provider configured.

## Stage 3 Applications and review

Implement approved plan settings and fixed application fields, profile/photo handling, correction/rejection/approval workflow and admin search/filter. Confirm membership eligibility and renewal decisions. Log reviews. Do not collect sensitive extra fields speculatively.

Exit: member completes/corrects application, staff decides, another member cannot access it; unapproved applications cannot initiate paid activation.

## Stage 4 Payments and membership lifecycle

Implement gateway adapter and first approved provider sandbox, verified webhooks, idempotent fulfillment, membership periods and renewal. Add status reconciliation. If recurring is confirmed, implement supported consent/cancel/failure flows within this stage and adjust internal allocations without silently dropping other scope.

Exit: successful/failed/duplicate/out-of-order/concurrent events tested on actual transaction-capable database; membership granted once; sandbox evidence retained. A mock does not pass the provider integration gate.

## Stage 5 Member portal cards and administration

Complete portal, Arabic/English PDF card using the supplied approved card design, QR verification and revocation, suspension/extension controls, email reminders, counts and CSV. Populate agreed approved content. Run the first full bilingual end-to-end journey.

Exit: real member-to-admin-to-payment-to-card journey; public verification exposes only approved fields; expired/suspended states remain correct; exports are authorized and safe.

## Stage 6 Acceptance and operational verification

Run docs/ACCEPTANCE.md; remedy failures. Test responsive/accessibility, keyboard/touch interactions, reduced motion, artwork replacement/cropping and security-sensitive paths; verify email behavior and restore database/files in isolation. Prepare setup, admin, deployment, rollback and API documentation. Review launch decisions and outstanding provider requirements.

Exit: actual evidence for mandatory checks; no core blocking defects; minor issues documented for written acceptance. Confirm no production mock modes, exposed secrets or sample claims remain.

## Stage 7 Deployment and handover

Deploy only after Malek authorizes the target environment and launch. Verify TLS, live provider configuration and one authorized payment check where possible. Train administrator, provide source/docs/accounts as commercially agreed, record acceptance and warranty start.

Exit: deployment and rollback instructions verified, access responsibility recorded, handover accepted. Do not mark client acceptance, live launch, warranty start or payment receipt yourself.

## Every coding session

Select one bounded task. Implement UI + API + data behavior together where relevant. Run checks proportionate to risk; prioritize permission and payment correctness over meaningless coverage targets. Update progress with exact evidence, remaining work and next task. If blocked on a provider, finish independent work and identify the missing prerequisite rather than simulating completion.
