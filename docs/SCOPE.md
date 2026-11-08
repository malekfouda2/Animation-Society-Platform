# MVP scope

## Purpose

Deliver a bilingual public website and a membership service. The core journey is application, staff approval, verified payment and membership activation. The build is designed for future extension, but future modules are not part of this release.

## Public website

| Area | Included behavior |
| --- | --- |
| Home | Introduction, featured content, calls to action, externally hosted introductory video |
| About | Structured introduction, objectives, board and General Assembly information |
| Animation fields | One page with 2D, 3D, stop motion and hybrid categories |
| Projects and initiatives | Public listing and reusable detail template; no internal project operations |
| News and events | Shared publishing module with categories and listing/detail templates; external registration links |
| Membership | Agreed plans, benefits, prices and durations; one fixed bilingual application form |
| Partners | Names, logos and website links |
| Contact | Form sends to the Society mailbox; replies happen in that mailbox |
| Policies | Publish supplied policy text in both languages |

Artistic direction and replaceable temporary artwork are defined in docs/DESIGN_BRIEF.md. Use predefined editable layouts, not an unrestricted page builder. Include image/link editing, basic metadata, responsive design and localized navigation. Public draft content must remain private. The Society supplies approved editorial copy, translations, media and policies. Initial entry volume must be recorded before bulk content entry. Interface translations may be drafted for review; do not claim client approval.

## Accounts and applications

Email registration/verification, login/logout, reset, profile editing and one fixed application. Proposed minimum fields: name, email, phone, city, specialization, membership type and photo where needed for the card. Confirm required fields at discovery. Do not add national ID, date of birth or document uploads without a defined need and approval.

Staff can request corrections, approve or reject with recorded reasons/history. A corrected submission returns for review. Staff establish eligibility; successful payment alone must not bypass approval or grant voting rights. A voting/election system is not included.

## Payments and entitlement

One selected Saudi-compatible payment gateway. Checkout amount and currency come from a server-side plan snapshot. Require approved merchant account/capabilities for live use. Include successful, failed, canceled, delayed and duplicate event handling, payment history and reconciliation of uncertain attempts.

Manual renewal checkout, expiry and essential reminders are baseline. If requested, recurring billing is included using the chosen gateway's supported capabilities. Confirm consent, cancellation, payment failure/retry, renewal price and entitlement rules before implementing/enabling live recurring billing. Provider charges are separate.

An active early renewal must not accidentally erase remaining validity; an expired renewal must use the confirmed start-date policy. Confirm plan duration arithmetic, grace period, reminder dates and whether renewal requires further review. Tests use an injectable clock. Use UTC timestamps with deliberate display formatting.

No added payment gateway, invoicing/accounting suite, complex upgrades/discounts, installment model or generic subscription engine. Reflect refund/reversal events accurately if the provider emits them; this does not imply a refund-management UI. Resolve their entitlement impact explicitly.

## Member portal and card

Member profile, application status, membership state/expiry, renewal action, PDF card and payment history. One fixed bilingual card design based on the supplied Society card template once inspected, with member name, number, photo, start/expiry dates and QR link.

QR verification is live and reveals only approved minimal public fields. Tokens must be unguessable, revocable and rate-limited. Reissued cards revoke prior tokens. Suspended/expired members must not appear active because an old PDF is scanned. A downloaded PDF is a dated artifact; live verification is the authority. Do not expose email, phone or payment information through public verification. No wallet passes or card designer.

## Administration

Administrator and content-editor staff roles, alongside the member account role. Admin manages applications, members, cards and agreed suspend/reissue/extend actions. Editor manages only public content. Include search, filtering, pagination, basic counts and authorized CSV exports. No role-builder or arbitrary permission editor.

Material administrative decisions, status changes, exports and payment transitions retain actor/time/target/reason where applicable. Do not permit financial history to be silently rewritten.

## Communication and operations

Essential emails: verification/reset, application receipt and review outcome/correction request, payment/activation and agreed expiry reminders. Respect selected locale. Use durable jobs, safe retries and deduplication for business events. Contact-form processing must prevent header injection and abuse. No helpdesk, campaigns, SMS or WhatsApp.

HTTPS, server-side authorization, administrator MFA, password hashing, input/file validation, rate limits, protected secrets and backups. Separate staging/production data and credentials. Restore one isolated database/file backup before handover. Test keyboard/focus, labels/errors, contrast, responsive layouts and Arabic PDFs. No blanket legal/accessibility certification or independent penetration test is included.

## Future phases

Design clean module interfaces and referenceable entities so later work can extend this platform. Do not create speculative collections or screens for:

- Internal portfolios/programmes/projects/tasks, budgets, risks, decisions and evidence workflows.
- Native event registration, attendance, certificates, competitions and learning systems.
- Partner redemption, helpdesk, advanced dashboards, form/page builders and granular custom roles.
- Additional payment gateways, complex membership rules and wallet passes.
- Mobile apps, accounting/CRM/AI/Google Workspace/Monday.com integrations and campaigns.

Public ProjectContent is editorial content, not an internal Project management entity. Future additions are separately planned and priced and may require migrations or infrastructure changes. Historical data migration, copywriting and professional translation are outside this build.

## Handover

Source code, configuration/admin instructions, deployment notes, dependency/license list, tests and one administrator training session. Provider accounts should belong to the Society. Final repository-transfer timing remains a commercial decision. The 60-day defect warranty concerns delivered functionality; ongoing support is separately arranged.
