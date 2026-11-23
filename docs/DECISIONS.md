# Decisions and assumptions

Status as of 2 November 2026: no signed contract, settled amendments or provider selection has been supplied. Malek reports a Society Drive folder containing brand/card assets, but its URL and contents have not yet been supplied or inspected. Local engineering can begin with mocks/synthetic data. This does not confirm signature, payment receipt or commercial kickoff.

## Blocking decisions by implementation stage

| ID | Decision | Proposed temporary approach | Needed before |
| --- | --- | --- | --- |
| D01 | Society Drive URL and inspection of logos, identity and card templates | Request link/local copy; original provisional art allowed; no fabricated brand approval | Final branded design and card implementation |
| D02 | Membership types, prices, duration, eligibility and required fields | **Largely resolved 19 Nov 2026** from the bylaws and 2026 profile (see "Society documents" below). Open: supporting membership's online process, final application fields | Production seed and membership acceptance |
| D03 | Gateway and merchant account capabilities | **Tap selected by Malek, 23 Nov 2026.** Open: merchant account, sandbox keys, and confirming saved-card renewal on that account. Provider adapter plus clearly marked development mock until then | Real sandbox integration |
| D04 | Manual versus recurring renewal | **Decided 23 Nov 2026: automatic renewal with an admin notice first** (see below). Depends on gateway support | Payment design freeze/live billing |
| D05 | Early/expired renewal, review, grace and reminder rules | **No new review on renewal (23 Nov 2026).** Open: how long before renewal admins are notified, failed-payment grace. Test with synthetic values | Entitlement implementation acceptance |
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

## Application and review decisions for Stage 3 (15 November 2026, developer, reversible)

Made so Stage 3 could proceed with demo plans while D02 is open. None is a Society policy; Malek can change any of them.

1. **Demo plans.** Two plans, "Working membership (demo)" and "Affiliate membership (demo)", follow the two membership types people apply for in the Society's materials. Their prices (SAR 10.00 and 5.00) and the 12-month duration are synthetic. They are flagged `demo` in the database and labelled on every screen. Only the development seed command can create them, and it refuses to run in production. Plans that staff create are never demo plans.
2. **Application fields** (the proposed minimum from SCOPE): full name as it should appear on the card, mobile number, city, main field (2D, 3D, stop motion, hybrid, other) and a photo. Email comes from the account. The plan is chosen in the form. No national ID, date of birth or documents.
3. **One application per account.** A member keeps one application, which moves through draft → submitted ⇄ needs_changes → approved or rejected.
4. **Rejection is final for now.** No reapply transition exists until the Society decides whether rejected applicants may apply again.
5. **Staff messages are shown to the applicant.** The correction request and the rejection reason are emailed to the applicant and shown in the member area. There are no private staff notes.
6. **Administrators review; editors don't.** Review and plan settings need the administrator role and the second factor. They do not ask for a fresh password or code on each decision: the 30-minute staff idle limit and the second factor were judged enough. Re-authentication remains available if Malek wants it.
7. **Plan snapshot.** Submitting records the plan as it is at that moment (name, price, currency, duration, version). A later price change does not affect submitted applications; a resubmission after corrections takes the plan as it is then. Stage 4 checkout must charge the snapshot of an approved application (`checkoutEligibility`), never a price from the request.
8. **Member photos are private.** Re-encoded to WebP with metadata removed (longest side 1200 px). Only the owner and administrators can see them. They can't be used on public pages and are kept until a retention rule exists (D09).
9. **Applicant email for search** is copied from the account when the application is created. Accounts can't change their email yet, so the copy can't go stale.

## Society documents applied (19 November 2026)

Malek supplied the bylaws (اللائحة الأساسية v.3) and the 2026 profile (ملف_الجمعية_التعريفي_2026) as the authority for policies and content, "don't improvise". Applied as follows (details in docs/CONTENT_REVISION_PLAN.md):

1. **Plans** are the bylaws' categories with the profile's names and fees: student «المنتسب» SAR 200, participant SAR 400, ordinary «القيادي» SAR 600, supporting SAR 600 plus a donation of at least SAR 100,000. Honorary is granted by the board and is not a plan. There is no "distinguished" category (the profile says so); the old Instagram-based types (working, affiliate, honorary, distinguished) are gone.
2. **Financial-year fees** (Articles 12 and 54): a membership year ends on 31 December; joining mid-year pays the yearly fee × months left (counting the joining month) ÷ 12, in Riyadh time. **Malek's decision** on how to count it (by month).
3. **Eligibility checks** from the bylaws: participant and ordinary over 18 (date of birth); student a proof-of-study image; ordinary six months' earlier membership (Article 17). The site checks the format and the dates; staff check the documents.
4. **Benefits:** **Malek's decision**: discounts and library access are removed from every category. The rest are shown with the profile's own note that they are proposed and take effect by board decision.
5. **People:** **Malek's decision**: the board (5) and the General Assembly (14) are published with names and portraits as in the profile. Two Assembly members have no photo in the profile and show an initial.
6. **Refunds:** none (Article 14(3)), quoted in the payment and refund policy.
7. **Policies:** membership (Articles 13–14), payment and refund (Articles 12 and 14(3)) and the website privacy policy (the Society's data privacy policy, Article 5) are quoted as written. Terms of use and card use stay pending: no source exists. The bylaws and readable policies are downloadable as the Society's PDFs.
8. **English** is a developer translation of all of this, awaiting the Society's approval (D08).

Developer choices made while applying them (reversible):
- **Supporting membership is switched off** for online applications: a card checkout can't take a SAR 100,000 donation from the member's own account.
- **"Over 18" is read as 18 or older.**
- **Proof of study is an image** (PNG, JPEG or WebP), private like the card photo. PDFs aren't accepted yet.
- **Earlier membership** is a declared month that staff verify, because the site has no membership history before launch.
- **Partner links and project fields are optional**, because the profile gives partner names and logos only, and the initiatives aren't tied to one animation technique.
- **The General Assembly text** combines Article 1's definition with Article 15's sentence on binding decisions.

Found in the documents and left for the Society (not changed):
- **Age:** Article 9 says over 18 for ordinary members, but Article 17(1)(a) says at least 15 for General Assembly membership.
- **Supporting donation:** slide 32 shows "≤ 100,000", but Article 10 and slide 33 say "not less than". The site follows the bylaws.
- **Licence numbers:** the About text cites a Ministry of Labour licence no. 73739, while the official line gives registration 2189 and decision 74915.
- **Spelling in the About and goals text,** copied as written: التمية, الي, المحتوي, "الرسوم المتحرك", "و استهداف". Point 9 of the privacy policy repeats "ببياناتك أو بياناتك".
- **Article 8(4)** says membership is «مغلقة» (closed), while Article 16 lists both closed and open benefit.
- **Four governance PDFs are damaged in the Drive itself:** conflict of interest, whistleblowing, document retention, and the membership-request procedure. Re-downloads are byte-identical and Drive's own preview fails. They need re-uploading.
- **Article 17(1)(ح) requires the National Center's (NCNP) application form.** Its fields are unknown, because the procedure PDF is one of the damaged ones.

## Membership decisions from Malek (23 November 2026)

1. **Reapplying:** a rejected applicant may apply again six calendar months after the decision. Built: the same application reopens as a draft, and its history is kept.
2. **Renewal (D04, D05):** renewal is automatic, with no new review. Administrators must be notified in the dashboard before each renewal so they can change the membership or cancel the renewal. **Not built:** this is Stage 4 and depends on the gateway supporting saved-payment charges (D03).
3. **Supporting membership:** the applicant sends a request, the Society meets them outside the site, and an administrator approves in the dashboard. The member then gets a payment link or pays from the member dashboard. Built up to approval, which requires the administrator to confirm the meeting (recorded in the activity log). **The payment link and checkout are Stage 4.**
4. **NCNP form fields (Article 17):** flagged; Malek will answer later.
5. **Card name:** collected in both Arabic and English.
6. **Minimum age:** 18 for every plan, including student (Malek's decision; the bylaws set no age for students).
7. **Wording (D08):** the Arabic and English application and email wording is approved. Strings added on 23 Nov for the decisions above came after that approval: both name fields, reapply messages, the by-request note, the meeting confirmation, and the reapply sentence in the rejection email.
8. **Retention (D09):** member photos and proof-of-study documents are always kept. No deletion job exists. Legal review is advisable before launch, because Saudi personal-data rules limit keeping data longer than needed.

Developer assumptions (reversible):
- The site's supporting fee is the SAR 600 membership fee, pro-rated like other plans. The donation of at least SAR 100,000 is arranged directly with the Society and is not charged through the site.
- Supporting applicants must still meet the ordinary-membership conditions on the form (18 or older, six months' earlier membership).

### Decisions still needed for membership (updated 23 November 2026)

- The NCNP form's fields (Article 17).
- Confirmation that the supporting donation stays outside the site's checkout.

