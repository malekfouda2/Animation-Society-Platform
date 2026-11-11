# Decisions and assumptions

Status as of 2 November 2026: no signed contract, settled amendments or provider selection has been supplied. Malek reports a Society Drive folder containing brand/card assets, but its URL and contents have not yet been supplied or inspected. Local engineering can begin with mocks/synthetic data. This does not confirm signature, payment receipt or commercial kickoff.

## Blocking decisions by implementation stage

| ID | Decision | Proposed temporary approach | Needed before |
| --- | --- | --- | --- |
| D01 | Society Drive URL and inspection of logos, identity and card templates | Request link/local copy; original provisional art allowed; no fabricated brand approval | Final branded design and card implementation |
| D02 | Membership types, prices, duration, eligibility and required fields | Synthetic explicitly marked demo plans | Production seed and membership acceptance |
| D03 | Gateway and merchant account capabilities | Provider adapter plus clearly marked development mock | Real sandbox integration |
| D04 | Manual versus recurring renewal | Build manual core and extension point; recurring is conditional included scope | Payment design freeze/live billing |
| D05 | Early/expired renewal, review, grace and reminder rules | Record proposed rules; test with synthetic values | Entitlement implementation acceptance |
| D06 | Hosting, email, storage, backup locations and remote access from Egypt | Local services/synthetic data | Any real data processing |
| D07 | QR public fields and verification privacy | Minimal status/member number; no contact fields | Public verification launch |
| D08 | Approved content/translations and entry quantities | Labeled sample copy | Content population and launch |
| D09 | Retention, deletion/export handling, consent and policy wording | Technical hooks; no invented retention periods | Real member onboarding |
| D10 | Free/honorary plans, if any | Do not infer them; define staff-issued entitlement only if requested | Plan-rule finalization |
| D11 | Refund/reversal/canceled subscriptions and overdue-payment policy | Reconcile and flag for review; never assume renewed entitlement | Live payments |
| D12 | Production domain, administrator contact and emergency access | Localhost/test inbox | Deployment |

The draft contract lists provisional annual membership fees (kept with the commercial notes outside the repository). They must not be seeded as approved production prices.

## Confirmed creative direction

Follow docs/DESIGN_BRIEF.md: artistic animation-specific design, meaningful interaction, frontend-design and UI/UX skills required for design tasks, original temporary artwork/animation with easy replacement, and Cinema Association as a conceptual reference only. These directions are confirmed by Malek; the asset URL and final visual approval remain pending.

## Proposed engineering decisions

TypeScript, npm workspaces, React via Next.js, Express API, MongoDB/Mongoose, secure server-side sessions, a Mongo-backed durable worker and protected file storage. These are recommendations; inspect existing code and confirm viable supported versions. Production hosting is not chosen. A single production host can be a modest launch option but is a single point of failure, not high availability. A replica set configuration enables transactions but alone does not establish resilience or backups.

## Media and page-section decisions for Stage 2 (11 November 2026, developer, reversible)

1. **Images only, re-encoded.** Staff may upload PNG, JPEG or WebP up to 8 MB. The declared type must match the real format; images with more than 40 megapixels or fewer than 16 pixels a side are refused. Every image is decoded and re-encoded to WebP (longest side 2400 px) with all metadata removed, so camera details, locations and anything hidden in the file never reach the site. SVG is not accepted (it can carry scripts).
2. **Private until published.** An uploaded image can be seen only by signed-in staff until a published entry uses it; unpublishing hides it again. Public images are cached for 5 minutes.
3. **Descriptions belong to the use, not the file.** Each place an image appears has its own description (alt text) in Arabic and English, required before publishing.
4. **Storage.** Files live on the API server's disk (`MEDIA_DIR`), outside the web app's public folder, served through the API. Production needs persistent storage for it, included in backups (Stage 6 restore test).
5. **Page sections are fixed.** Eleven sections (homepage opening, About, vision and mission, goals, General Assembly, board, five policies) can be written, published and unpublished but not created freely or deleted. The four goals keep their fixed icons. Policies show only text staff publish; no legal wording is written by the developer.
6. **One source.** The section texts moved out of the web code into the database (seed command). A section that isn't published shows the honest "awaiting content" state, as before.
7. **Library and clean-up.** All uploads are listed in a staff Media page with how many entries use each (drafts count, so a picture chosen for an unpublished draft is never treated as unused). Staff can delete an unused image there after confirming; images in use can't be deleted. `npm run media -w @as/api -- prune` deletes unused uploads older than 24 hours (a grace period for drafts not saved yet) and is meant to run daily once a scheduler exists (Stage 5 worker or the host's cron). Every deletion is in the activity log.
8. **Cropping is per use and non-destructive.** Each place an image appears stores its own crop (fractions of the picture); the file is never changed. Pages draw the cropped area with an SVG viewBox, which scales it like an image ("cover" for photos, "contain" for logos), so no server work or extra files are needed. The trade-off: the whole file is downloaded even when a small part is shown (files are already at most 2400 px). Shapes offered: free, 1:1, 4:3, 16:9, 3:4.

## Open contract matters for Malek

The unresolved differences between the Society's draft contract and Malek's quotation are kept with the commercial notes outside this public repository. They are not accepted commitments. Do not add contractual promises to README, product screens, tickets or deployment settings. Ask Malek only when an unresolved decision affects the current task; proceed with independent work otherwise. Once a signed agreement is provided, reconcile it before production implementation of conflicting requirements.

## Decisions from Malek (8 November 2026), after the Drive recheck

1. **Vision and goals:** use the latest statements in the Drive, the English introduction film (Jul 2022). Applied: its vision ("To be pioneers in the animation industry…") and its four goals replace the five objectives from the brief. The Arabic goal wording comes verbatim from the Arabic film (Mar 2022). The Arabic vision is a developer translation (marked draft) because the Arabic film has none. The mission stays pending: only the older Arabic film has one.
2. **Introduction film:** the Arabic film on `/ar`, the English film on `/en`, hosted with the site (no YouTube/Vimeo). Applied as web re-encodes in `apps/web/public/video/` (see ARTWORK_REPLACEMENT.md).
3. **Membership fees:** answer to follow (D02 stays open).
4. **Registration number and Ministry of Culture licence on the site:** answer to follow; not shown yet.
5. **Presentation-deck icons:** not used.


## Identity decisions for Stage 2 (10 November 2026, developer, reversible)

Made to unblock the account system. None is a Society policy; Malek can change any of them.

1. **Email confirmation before sign-in.** A member must confirm the email address before the first sign-in. Following a reset link also counts as confirming it.
2. **Two-step sign-in for every staff role.** It applies to editors as well as administrators. The authenticator is TOTP (any standard app), with ten single-use recovery codes. If staff lose both the phone and the codes, an operator resets it with the staff CLI after checking their identity out of band, and the CLI records the reason.
3. **Session lifetimes.**
   - Members: 30 days absolute, 14 days idle.
   - Staff: 12 hours absolute, 30 minutes idle.
   - The second factor must be completed within 10 minutes of the password step.
   - Sensitive actions will require a password or code entered within the last 10 minutes.
4. **Sessions are implemented in-house as ARCHITECTURE describes.** The cookie holds an opaque token; the database stores only its SHA-256, with the user and expiry. express-session was not used because it stores the session ID itself, not a hash. The cryptography comes from maintained libraries: Node `crypto`, `@node-rs/argon2` and `otplib`.
5. **Staff accounts come only from the operator CLI**, through an emailed set-password link. There is no public route and no seed admin with a default password.
6. **Email wording** in both languages is a developer draft pending the Society's review (D08). Account emails are plain text.

## Content publishing decisions for Stage 2 (11 November 2026, developer, reversible)

1. **Draft and published copies.** Each news/event post, project and partner keeps a working draft and a separate published copy. Saving never changes the public site; publishing copies the draft. Editors and administrators can both publish; there is no separate approval step, because the Society has not asked for one.
2. **Both languages before publishing.** Every public text must be filled in Arabic and English before an entry can be published (an optional event location must be given in both or neither). Drafts may be incomplete.
3. **Addresses are fixed once published**, so shared links keep working. Only entries that are not on the site can be deleted; the activity log keeps a record.
4. **Concurrent edits.** Every save names the version it started from; a stale save is refused with a message to reload, never merged or overwritten.
5. **Honest notes stay.** Each entry carries a public note setting (approved: no note; from Society materials; draft copy) so content awaiting sign-off is still labelled as before.
6. **Scope of task 2.** Image uploads and the fixed page sections were added in task 3 (below). Partners without a logo show their name lettered on the cel; projects without a picture use a cover from the site's artwork manifest.
7. **Contact forwarding.** Contact messages go through the email outbox to `CONTACT_INBOX`, rendered in Arabic. The Society's real mailbox has not been supplied, so nothing is forwarded in production until it is (D06).
