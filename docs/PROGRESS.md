# Project progress

Status: Stage 1 done. Design checkpoint redone as a full "night studio" redesign after Malek named mbvision-kw.com as the design reference (5 Nov 2026); homepage sections below the hero redesigned individually on 8 Nov 2026. Awaiting Malek's design review.
Current stage: Stage 2 (identity and publishing). Tasks 1–3, the media follow-up and the artwork replacement check (D-A05) done (10–11 Nov 2026) and committed on 11 Nov 2026 without the introduction films. Engineering exit criteria met in development; Stage 2 closes after Malek's design review (D-A03).
Approved kickoff date: not supplied.
Signed contract: not supplied.

## Completed

- MVP handoff documentation and stage prompts.
- Rechecked the revised quotation against the pack's scope.
- Added Malek's artistic design direction, conceptual Cinema reference, required design skills and original replaceable artwork/animation requirements.
- Stage 1 foundation (2 November 2026), see handoff below. Closed on 8 November 2026 (see "Stage 1 closure").
- Society Drive supplied and inventoried (docs/BRAND_ASSETS.md); guideline logo, palette, Cairo and RNS Sanz, Visual Elements and icons applied (3–4 November).
- frontend-design and VectorLab UI/UX skills installed and used for all interface work since 4 November.
- Public site: 12 homepage sections and inner pages, contact form slice, night-studio redesign, per-section homepage designs, scroll performance pass and section entrances (4–8 November).

## Stage 2 close-out: artwork replacement check and commit, 11 November 2026

Asked for: run D-A05 and commit/push, without committing media.

D-A05 (artwork replacement):
- Swapped `field2d` by editing only its `ARTWORK` entry (src, width, height, Arabic and English alt) to a synthetic 1200×800 WebP. It was 3:2 rather than 4:3 on purpose, with a marker in each corner.
- Production build, headless Chrome, `/en`, `/ar`, `/en/fields`, `/ar/fields` at 390 and 1280 (script: scratchpad `tools/swap-journey.mjs`):
  - the new file loaded in every place the old one did, and the old file was no longer requested;
  - all four corner markers were visible, so nothing was cropped;
  - the new alt text appeared on the `/fields` stage image in both languages; decorative copies kept empty alt;
  - lang/dir were correct, with no horizontal overflow.
- **Defect found and fixed:** the `/fields` stage (`fields.module.css .art`) stretched any drawing that isn't 4:3. It now uses `object-fit: contain`. No other layout code changed.
- The original artwork was restored and the test file deleted. The guide's step 4 now covers `/fields` and records the test.

Media kept out of git (Malek, 11 Nov 2026): `apps/web/public/video/` (both films and posters, about 34 MB) is git-ignored. DEVELOPMENT.md explains how to put them back on a checkout or server. A fresh clone shows an empty video player until they're copied in.

CI after the push:
- The first GitHub run of the replica-set integration tests failed (run 43045937376).
- The MongoDB start step had no failure exit, so it now fails on its own and writes the container log into the run's annotations.
- That surfaced the cause (run 43046883544): the `ubuntu-latest` runner is now Ubuntu 26, and its Linux kernel 6.19+ makes MongoDB 8.0 refuse to start.
- MongoDB's issue SERVER-121912 lists no fixed version.
- Pinning `ubuntu-24.04` didn't help: those runners also have 6.19+ (run 43047604808).
- `mongo:8.2.12` has no startup refusal, so CI now runs the integration tests on it. Run 43049660961 on `33bc0d5` passed every step, including 33 integration tests and the build.
- Local development still uses MongoDB 8.0 (Docker Desktop's kernel is older), so CI and development now differ.
- **Decision needed (Malek):** move development and production to 8.2 as well, and check the production host's kernel when it is chosen (Stage 7).

Still open (deferred by Malek, to be raised again at each stage boundary):
- Malek's design review, two rounds (D-A03): this is what closes Stage 2.
- Society content: vision and mission, board, General Assembly text, policies, partners, news, contact details and inbox (D06), intro-film captions, and approval of draft copy, including the Arabic admin wording.
- Safari, Firefox, real-device and screen-reader passes (Stage 6).
- A schedule for `media prune` (worker or server job).
- Editor extras: draft preview, staff list search and filter, scheduled publishing.
- How the films reach production, now that they aren't in the repo.
- Stage 3 needs D01–D03 (plans and application fields).

## Stage 2 follow-up: media library, clean-up and cropping, 11 November 2026

Asked for: delete unused uploads; a library to reuse images; cropping.

Built:
- **Contracts:**
  - `cropSchema`: fractions, kept inside the picture, minimum 2%. Image references now carry `crop`, which defaults to the whole picture.
  - `mediaListSchema`, and `referencedMediaIds`, which reads stored data of any age.
- **API:**
  - Usage is counted across drafts and published copies.
  - `GET /admin/media`: library, newest first, 60 per page, `filter=unused`.
  - `DELETE /admin/media/:id`: staff, same-origin; 409 if the image is in use; deletes the record and the file; logged in the activity log.
  - `cli/media.ts prune [--dry-run] [--older-than-hours N]`: deletes unused uploads past a 24 h grace period, and keeps any picked up since the scan.
- **Web:**
  - **Media page** (`/admin/media`, Pattern 1): upload, all or unused, usage per image, delete unused with an inline confirmation that focuses "Keep it".
  - **Editor image fields:**
    - "Choose from library" opens a picker in a native modal dialog; picking resets the crop and description for a different image.
    - "Crop" (shows Whole image or Cropped) opens the crop tool: drag the frame or its corners; shapes free, 1:1, 4:3, 16:9, 3:4; arrow keys move the frame, Shift with arrow keys resizes; live pixel size.
  - **Public pages:**
    - A cropped image renders as an SVG viewBox with `role="img"` and the description: cover for pictures, contain for logos.
    - Uncropped images stay plain `<img>`.
    - The partner logo is now limited to its cel.

Checks (actually run):
- `npm run check`: exit 0 (contracts 8, API 25, web 12 tests, build).
- `npm run test:integration`: 33/33. The new test covers:
  - library usage counts (a draft counts);
  - the unused filter;
  - an in-use image refused (409);
  - delete without Origin refused, and an Origin-checked delete that removes the file;
  - a crop outside the picture refused;
  - prune picks only unused uploads older than 24 h.
- `npm run media -w @as/api -- prune --dry-run` on the dev database: 0 candidates.
- Chrome (production build) as a synthetic editor:
  - two synthetic images uploaded on the Media page;
  - a partner picked one from the library, cropped it to a square and moved/resized the frame by keyboard (392 × 392 px), then published;
  - the public page drew the cropped logo with its description;
  - the Media page showed "Used in 1 entry" and "Not used"; the unused image was deleted after confirming;
  - Arabic Media page and the crop dialog at 390 px; no overflow at 1280 or 390.
- Two visual faults were found and fixed:
  - the cropped square logo overflowed its partner card;
  - the crop corners were clipped at the picture edge (the dimming is now its own clipped layer).
- The synthetic data was removed afterwards.

Known limits:
- A cropped image still downloads the whole file (at most 2400 px).
- Prune isn't scheduled yet; it needs the Stage 5 worker or the host's cron.
- Deleting races with a save that picks the same image at the same moment. The content save then reports the image as missing, and nothing is corrupted.
- Checked in Chrome only.

## Stage 2, task 3: media uploads and editable page sections, 11 November 2026

Scope: staff upload images for posts, projects, partners and board members, and edit the fixed page sections; both follow the draft and publish rules of task 2.

Built:
- **Contracts:**
  - New content kind `section`. Its draft schema is a union discriminated by `section` across eleven fixed keys; the `publishIssues` rules cover each one.
  - `mediaRefSchema` (`id`, `alt` in both languages, `width`, `height`). Defaults let older entries read as "no image".
  - `mediaIds`, `emptySection`, upload limits and types.
- **API:**
  - `features/media`: `mediaAssets` collection plus files in `MEDIA_DIR`.
  - Upload checks:
    - `POST /admin/media` takes the raw body; staff with the second factor only; same-origin; 60 uploads per 10 minutes per account.
    - The declared type must match the real format; a 40 MP decode limit; 16 px minimum.
    - Every file is re-encoded to WebP (EXIF orientation applied, metadata dropped), written atomically, and logged in the activity log.
  - `GET /media/:id`: public only while a published entry uses the image (5 min cache); otherwise staff only (`no-store`); 404 for everyone else.
  - The content service now checks that referenced images exist. Section keys must match their content, a section's address can't change, and sections can't be deleted.
  - The seed command now also publishes the hero, About, vision, goals and General Assembly sections. The text is identical to the previous web constants (22/22 strings checked), with the same notes.
  - New dependency: `sharp` 0.35.5 (npm audit: 0 vulnerabilities).
- **Web:**
  - Admin "Page sections" list (Pattern 1): all eleven, written or not, with status and where each shows.
  - Section editors per section, including a board member list (add/remove; name and role in both languages; portrait).
  - Image field in the editor: upload/replace/remove, preview, description in both languages. The file input stays keyboard-reachable. Client checks run first, then the server's reasons are shown.
  - Public pages:
    - About, homepage, policies and the coming-soon preview read sections through `lib/site-sections.ts` (one cached fetch per request).
    - Unpublished sections show "awaiting content", and status notes come from each section's setting.
    - The board renders as a cast list, with portraits or initials.
    - Project pictures replace the illustrative cover; partner logos sit on the cels; post images head the article.
    - Published copies are read through the shared schema, so older entries get the new defaults.
  - `content/society.ts` keeps only the Society's fixed facts; `content/policies.ts` only the policy titles.

Checks (actually run):
- `npm run check`: exit 0 (contracts 7, API 25, web 12 tests, build).
- `npm run test:integration`: 32/32. The new `media.int.test.ts` covers:
  - fake, SVG, mislabeled and tiny files refused; metadata stripped;
  - a draft's image hidden, public once published, hidden again after unpublishing;
  - a missing image refused; path-like IDs 404;
  - section key rules, board publish rules, the public sections list, no deleting sections.
- The test clock now starts at the real time. With the fixed date of 10 Nov, the test client had begun dropping cookies whose expiry was already past.
- Chrome (production build) as a CLI-invited synthetic editor:
  - the sections list; the Arabic About editor;
  - a board with two synthetic members and a synthetic portrait: publish blocked on the missing Arabic role, then published;
  - a partner with a synthetic logo: its image returned 404 to an anonymous request as a draft and 200 after publishing;
  - public partners, About board (Arabic) and homepage governance; policies; phone views of the sections list and board editor.
  - No horizontal overflow at 1280 or 390.
  - The synthetic accounts, entries, images and files were removed afterwards. The seeded sections remain published in the dev database.

Not done or known gaps:
- Unused uploads, library reuse and cropping: done in the follow-up above.
- Production needs persistent storage for `MEDIA_DIR`, included in backups (Stage 6 restore test).
- Policies and board members await the Society's text and names; nothing was invented.
- Membership and field content stay in code. Plans and pricing belong to Stage 3 settings; the four animation fields are fixed site structure.
- Checked in Chrome only. Arabic admin wording is a developer draft.

Stage 2 exit criteria (PLAN): bilingual content persisted, drafts protected, editors publish but can't reach members, payments or roles (A08 evidence), public templates checked at 390/768/1280, and demo email only to the local inbox. All are met in development. Still needed to close: Malek's design review (D-A03, two rounds), and the D-A05 artwork-replacement check.

Next: after Malek's review, Stage 3 (applications and review). It needs the plan settings and application fields decided (D01–D03).

## Stage 2, task 2: bilingual content publishing, 11 November 2026

Scope: staff publish news and events, projects and partners in Arabic and English, with drafts kept private. The public pages read published content from the API. Editors can't reach member, payment or role data. Contact-form messages now go through the email outbox. Media uploads and the fixed page sections (About, vision, board, policies) are task 3.

Built:
- **Contracts** (`packages/contracts/src/content.ts`):
  - draft schemas per kind (strict, length limits, https-only links, ISO dates, slug rules);
  - `publishIssues` (every public text in both languages);
  - `emptyDraft`, `paragraphs`, and the admin and public entry shapes.
  - New error code `conflict` (409).
- **API** (`apps/api/src/features/content`):
  - `contentEntries` collection: draft, published copy, `dirty`, `version`; unique per kind and slug.
  - Service: list, get, create, update, publish, unpublish and delete. Each write is one transaction with an activity-log event (`content.*`, recording kind, slug and title).
  - Optimistic concurrency on `version`. The slug is locked after the first publish. Delete is allowed only when the entry isn't published.
  - Public routes `GET /content/:kind` and `GET /content/:kind/:slug` return published copies only.
  - Staff routes `/admin/content/:kind…` require admin or editor with the second factor passed, and the same-origin check.
  - The activity log shows content titles.
- **Seed and contact:**
  - `cli/content.ts seed` publishes the one supplied project (the Motion Analysis Challenges initiative, moved out of the web code). It skips if the entry is already there and adds no news, events or partners.
  - Contact messages go through the outbox (`contact_received` template) to `CONTACT_INBOX`. New env var; development uses a synthetic `society-inbox@example.test`.
- **Web:**
  - Admin nav: News and events, Projects, Partners.
  - List pages (Pattern 1): table frame with title in both languages, address, status lamp plus word, last saved; empty state with a create action.
  - Editor (Pattern 3, `components/admin/ContentEditor.tsx`):
    - Arabic and English inputs side by side, each in its own direction;
    - blur-first validation, buttons never disabled;
    - Publish saves first, then lists the missing language fields;
    - a status strip (Not published, Published, Unpublished changes) and a link to the live page;
    - a version-conflict message, and an inline delete confirmation that names the entry and focuses "Keep it";
    - a cover picker drawing on the artwork manifest;
    - the sticky action bar clears the development banner.
  - Public pages (projects, news, partners, homepage poster and end credits) read from `lib/public-content.ts` without cookies or caching.
    - Detail pages are now rendered on request (no static params).
    - The homepage is now dynamic too.
    - If the API can't be reached, list pages show a "couldn't load" state.
  - Partners are lettered on cels until logos can be uploaded. Static `content/news.ts`, `partners.ts` and `initiatives.ts` were removed.
  - Dictionaries: `content-admin-en.ts` and `content-admin-ar.ts`. The Arabic is a developer draft.

Checks (actually run):
- `npm run check`: exit 0. Lint, typecheck, unit tests (contracts 6, API 25, web 12) and build.
- `npm run test:integration`: 29/29 against the replica set. The new `content.int.test.ts` (7 tests) covers:
  - access: anonymous 401, member 403, staff without the second factor `mfa_required`, cross-origin 403;
  - drafts private, both languages required, republish needed, stale save 409, slug locked or taken, unsafe link and extra field rejected;
  - delete only when unpublished, the full audit trail, editor still refused the audit log;
  - contact message to the outbox.
- Chrome (headless, production build) as a synthetic editor invited by the CLI:
  - empty list; slug and URL blur errors; publish blocked with the Arabic fields marked; published;
  - the post on /en and /ar news, detail and homepage credits;
  - edit then "Unpublished changes" while the public title stays the old one;
  - partner published, shown, unpublished, delete confirmation, deleted;
  - Arabic project list, editor and cover picker; audit refused for the editor; contact message reaching the local inbox;
  - phone (390) and tablet (768) views.
  - No horizontal overflow at 1280, 768 or 390.
  - Two fixes came out of the review: the heading now switches to "Edit" once a new entry is saved, and the Publish button is hidden when there's nothing new to publish.
  - The synthetic accounts, entries and emails were then removed from the dev database.
- A later screenshot run stalled under low memory (the local servers were stopped by the system). A follow-up probe showed the pages responding normally after scrolling. The Arabic news list, partner grid and project detail were captured at the desktop width only in the first run.

Not done or known gaps:
- No uploads: partner logos and project or post images (task 3). The fixed page sections are still in code (task 3).
- No preview of a draft as the public page; editors see the form and the live page.
- No search or filter on the staff lists. Lists show the newest 200 entries.
- No scheduled publishing, and no revision history beyond the activity log.
- The Society mailbox for contact messages has not been supplied (D06), and the Arabic content-admin wording is a developer draft.
- Checked in Chrome only.

Next task (Stage 2, task 3): media uploads and editable page sections. Done 11 November 2026 (see above).

## Stage 2, task 1: accounts, sessions and staff two-step sign-in, 10 November 2026

Scope: the identity part of Stage 2 that protected publishing depends on (PLAN Stage 2: "secure sessions, verification/reset, role checks and administrator MFA before protected admin publishing"). Content publishing is task 2.

Acceptance criteria for this task:
- members can sign up, confirm their email, sign in and out, reset a forgotten password and edit their profile, in Arabic and English;
- links expire and work once;
- sessions are server-side, revocable and expire;
- staff accounts exist only by operator invitation, must enrol an authenticator and pass it at every sign-in, and have single-use recovery codes;
- role checks run on the server.

Built:
- **API** (`apps/api/src/features/auth`, `audit`, `email`, `admin`, `cli/staff.ts`):
  - Argon2id passwords (`@node-rs/argon2` 2.2.2, OWASP parameters). Minimum 12 characters, no composition rules.
  - Opaque 256-bit session cookie (`HttpOnly`, `SameSite=Lax`, `__Host-` prefixed and `Secure` in production). Only its SHA-256 is stored in `sessions`. Absolute, idle and half-finished-MFA expiry are checked on every request. The token rotates after the second factor and after a password change.
  - Every state-changing `/auth` and `/account` request must carry the site's Origin.
  - Single-use, expiring `authTokens`: email confirmation 24 h, reset 1 h, staff invitation 48 h. A new link retires older ones.
  - Same answer for known and unknown emails at sign-up, reset and sign-in. An unknown email burns the same hashing time.
  - TOTP for staff (`otplib` 13.5.0), with the secret sealed by AES-256-GCM under `MFA_ENCRYPTION_KEY` (outside the database). Replayed codes are refused with an atomic time-step guard.
  - Ten single-use recovery codes, stored hashed. The session is revoked after 5 wrong codes.
  - Re-authentication endpoint and `requireRecentAuth` guard, ready for later sensitive actions.
  - In-memory rate limits per IP and per email.
  - Append-only `auditEvents` for password set/reset/change, MFA enrolment, recovery-code use and regeneration, staff invite, role change, MFA reset and disable.
  - Email outbox written inside the same transaction. Bilingual plain-text templates, drafts pending Society review. Development-only local inbox route.
  - Staff CLI (`invite`, `reset-mfa`, `disable`). No public or seed route creates staff.
  - `GET /admin/overview` (admin and editor) and `GET /admin/audit` (admin only).
- **Web**:
  - Account screens in a separate `(auth)` group: sign-in, register, verify-email, forgot-password, reset-password (also staff invitation), two-factor, two-factor/setup and dev/inbox. They use the night-studio desk with one sheet of animation paper on its peg bar.
  - Forms use blur-first validation, never disable submit, and map server errors to translated messages.
  - Reset and confirmation tokens are removed from the address bar on load.
  - The member area (profile and language, password change) and staff area (overview, sign-in security with recovery codes, administrator-only activity log) check the session on the server and redirect. The API still authorises every call.
  - Member and staff navigation are real links now.
- **CI**: integration tests now run in GitHub Actions against a MongoDB 8.0 replica set container. This workflow change has not run on GitHub yet.

Checks (10 Nov):
- `npm run check` exit 0: contracts 3, API 25 unit, web 12, build.
- `npm run test:integration`: 22/22 against the local replica set. Cases:
  - registration and confirmation, with links single-use and expiring after 24 h;
  - duplicate sign-up handled without enumeration;
  - identical errors for a wrong password and an unknown email;
  - cross-origin requests refused;
  - sign-out revokes the session on the server, and the old cookie is refused;
  - 14-day member idle expiry;
  - reset expires after 1 h, works once and revokes every session;
  - mass-assigning a role is rejected;
  - a password change ends the other sessions;
  - a member is refused staff routes;
  - staff enrolment is required, and the token rotates;
  - a replayed code is refused;
  - recovery codes work once;
  - 5 wrong codes revoke the session;
  - 10-minute pending and 30-minute idle staff expiry;
  - an editor is refused the audit log;
  - the audit log has no secrets.
- Browser journey (production build, headless Chrome, scripted). English member: register, blur error, confirmation link from the local inbox, wrong password, sign-in, member page, "Staff only" on /admin, sign-out, redirect to sign-in. Arabic admin, from the CLI invitation:
  - set password;
  - enrolment with a QR code, a wrong code, then the real code;
  - ten recovery codes;
  - overview, security and activity log;
  - signing in again asks for the code.
  
  Also checked: phone width 390 for sign-in, register, forgot-password, the inbox and the admin overview; no page scrolls sideways at 1280 or 390. Blur validation was confirmed with real key events: the error appears on Tab and clears on focus.

Decisions taken (recorded in DECISIONS.md, all reversible):
- email must be confirmed before signing in;
- two-step sign-in for editors as well as admins;
- session lifetimes;
- sessions written in-house per ARCHITECTURE (no session library);
- staff only by CLI invitation.

Not done or known gaps:
- Rate limits are per process (in memory).
- No email change flow; email stays fixed.
- The local inbox stands in for an email provider (D06).
- The Arabic account and email wording is a developer draft.
- The language switch on the reset page drops an unused token, so the link must be opened again.
- Member and staff screens were checked in Chrome only.
- Sessions are not listed for users to end one by one.

Next task (Stage 2, task 2): bilingual content publishing. Done 11 November 2026 (see above).

## Inner pages and phone layouts, 9 November 2026

Malek: the inner pages looked basic and generated, and the phone view of every section was plain. Each inner page now has its own animation-studio device (frontend-design and VectorLab skills applied; reduced motion leaves every device static):
- Shared page hero (`components/sections/PageHero.tsx`): the camera field guide (twelve nested fields, a lit camera frame holding a brand shape) that trucks in as the hero scrolls away. New MotionEngine progress mode `leave`. The Drive crops no longer appear in inner heroes.
- About: a storyboard. Numbered panels with pencil sketches (`components/art/Sketches.tsx`), notes on ruled lines, the vision as a pull quote, the voting rule as yellow tape, goals as four thumbnail panels (a swipe strip on phones). `Objectives.tsx` and `MembershipTypes.tsx` removed (unused).
- Fields: one chapter per technique, each on its own set: 2D light table with onion skins, 3D viewport with grid floor and axis gizmo, stop-motion tabletop moving on twos, hybrid split between paper and grid. Roles as a crew sheet; jump nav as four drawing cels.
- Membership: each type as a card front (who it's for) with its back (what it includes) under a magnetic stripe; plans and benefits as blank tickets; journey; questions as a ruled list where the ball drops in when an answer opens.
- Projects: production slates (clapperboard with the field and status chalked in, a status lamp) beside the cover in a viewfinder; the detail page's slate claps shut on load and the body reads like a script page.
- News: an exposure sheet; filters are its column tabs; when empty, blank rows with a ball ticking down at 12 fps behind a taped note.
- Partners: acetate cels with peg holes; blank fanned cels until partners are approved.
- Contact: the form on a sheet of paper on the peg bar of a drawing disc that turns with scroll; other channels beside it.
- Policies: a production binder: coloured index tabs, punched pages, blank script lines with an "awaiting the Society's text" stamp, one shared contact prompt instead of five.
- 404: a film strip of the bouncing ball with the contact frame missing, inside the night-studio world.
- Homepage on phones: goals as one continuous zoetrope film strip swiped sideways; fields as a swipeable row of drawing sheets on the light table; membership cards stack like a deck as you scroll (sticky); footer links in two columns.
- Checks: `npm run check` exit 0. Screenshots at 1440 (en/ar) and 390 (en/ar) for home and every inner page, the project detail and the 404. Two phone overflows found and fixed (Arabic membership card pairs 470px, policies tabs 905px); all pages now report `scrollWidth = 390`.
- Not done: member and admin shells (they arrive with Stages 2–5); no real-device, Safari or Firefox pass.

## Introduction films, vision and goals, 8–9 November 2026

Malek's answers after the Drive recheck (DECISIONS.md, 8 Nov): use the latest vision and goals in the Drive; Arabic film on /ar and English film on /en, hosted with the site; fees and registration details to follow; deck icons not used.
- Films re-encoded for the web (83 MB → 18.7 MB and 75 MB → 16.5 MB, 720p H.264, fast start) into `apps/web/public/video/` with logo-end-card posters, plus a `VIDEOS` manifest entry. New `components/media/IntroFilm.tsx`: the homepage countdown leader now runs over the poster, then a play button appears; preload none, native controls after first play, pauses when off-screen. The screen is now 16:9.
- Vision (English film; Arabic developer translation marked draft) and four goals (English film's set; Arabic film's verbatim wording) replace the brief's five objectives. Goals have no body text. Mission shows "will be published once approved". The zoetrope radius is now computed from the goal count (it was fixed for five).
- Checks: `npm run check` exit 0. Screenshots at ar 1440, en 390 and en/about 1280. Playback tested with real click events in headless Chrome: Arabic plays (2.3 s after 3 s), English starts, focus moves to the video, it pauses when scrolled away, and the next page request serves the video with `206 Partial Content`. No page overflow.
- Open: English film captions (A25); fees (D02); registration line; film rights confirmation (third-party clips).

## Drive recheck, 8 November 2026

Request (Malek): stay in Stage 1; recheck the Society Drive for new material and anything missed before.
- With Malek's approval the Drive was downloaded to git-ignored `brand-source/drive-full/` (615 MB, 620 files), excluding the member-introduction posts and the payment vouchers. Read with poppler (PDF text/renders), a Swift AVFoundation script (video metadata and frames) and PowerPoint (deck exported to PDF).
- New: Arabic and English Society introduction films (2022), a *Captain Munch* film poster. Missed earlier: 2023 membership fees in Instagram stories (my 3 Nov note "no prices in the Drive" was wrong; corrected), official registration facts (founded 2021, registration 2189, Ministry of Culture licence), the 2024 report's 2023–2027 challenge schedule, prizes and impact figures, 108 vector icons in the presentation deck, frame-rate explainer posts, the business-card update to base the membership card on. 13 JPEGs and 3 PDFs are damaged in the Drive itself.
- Full write-up: docs/BRAND_ASSETS.md "Recheck of the Drive, 8 November 2026". Nothing was applied to the site yet; vision/mission/goals, fees, the video and the icons all need the Society's confirmation or a licence check first.

## Stage 1 closure, 8 November 2026

All Stage 1 exit criteria in docs/PLAN.md were met on 2 November; this closes the loose ends.
- First commit on `main` (8a112da), on top of the GitHub placeholder commit of https://github.com/malekfouda2/Animation-Society-Platform (public). At Malek's choice, before pushing: the RNS Sanz files moved to git-ignored `apps/web/public/fonts/rns-sanz/` and are loaded with `@font-face` (no `next/font/local`), so clean checkouts build and fall back to Cairo for English; the quotation, contract matters, draft fees and day-by-day schedule moved to git-ignored `docs/private/COMMERCIAL.md`; README rewritten as a project README.
- Fresh-clone verification (A01): clean clone → `npm ci` → env from `.env.example` → `npm run check` exit 0 and `npm run test:integration` 3/3. Defect found and fixed: root `lint` now builds `@as/contracts` first; before this, lint failed on every clean checkout and would have failed CI.
- Stale notes corrected: Drive supplied, design skills installed, Cairo/RNS Sanz replaced Readex Pro (DECISIONS, CLAUDE.md). Acceptance D-A03 and D-A07 updated with 8 November evidence.
- `package-lock 2.json` (a macOS duplicate from 3 Nov) is untracked and not committed; safe for Malek to delete.

- Pushed to GitHub `main` (commit 8a112da). First GitHub Actions CI run succeeded: https://github.com/malekfouda2/Animation-Society-Platform/actions/runs/42500365742

Still open, carried forward (not Stage 1 exit criteria): integration tests are not in CI; A02 covers Chrome only; Malek's design review (D-A03); RNS Sanz licence; membership card template; Society content approvals; hosting (D06).

Next: Malek's design review, then Stage 2 (sessions, verification/reset, roles, admin MFA).

## Session handoff: section entrances, 8 November 2026

Request (Malek): entrance animations for each section, keeping performance and smoothness.

How: elements carry `data-enter="<variant>"`; MotionEngine's IntersectionObserver adds `data-entered` once the element crosses 88% of the viewport, and a one-shot CSS keyframe plays (global.css). Transform and opacity only, never per frame. Elements on screen at load play immediately; ones already scrolled past show without animation. Waiting state exists only while MotionEngine runs (`html[data-motion="on"]`) and motion is allowed, so without JS or under reduced motion everything is visible. Entrances are exempt from the off-screen animation pause.

Per section: video (beam opens from the projector, title rises, screen flickers on like a lamp), About (paper slid onto the light table), objectives (heading rises, zoetrope rises into place), fields (heading, rows slide in from the reading side one by one, light table dropped in with a small settle), membership (title, lead, subheads, bouncing-ball path and numbered steps rise in order, membership cards dealt from below turning into place), projects (text rises, poster drops into its marquee with a small settle), governance (chamber title, Assembly and Board columns rise), credits (blocks roll up, the ball drops and squashes once).

Results: `npm run check` exit 0. All 35 entrance elements fire and finish fully opaque on a step-by-step scroll (ar 1440, en 390). Reduced motion (en 1280): none animate, all 35 visible. Scroll test (same 9 s method): 0 frames over 33 ms in 3 runs; style recalculation 0.65–0.73 s (was 0.53–0.61 s before entrances), paint 52–65 ms. Mid-animation frames reviewed.
Not tested: real devices, Safari, Firefox.

## Session handoff: scroll performance, 8 November 2026

Request (Malek): the site feels laggy and heavy; keep every animation but make it smooth.

Measured (headless Chrome, production build, /ar at 1440×900, 9 s of continuous wheel scrolling through Lenis plus pointer movement; 3 runs each):
- Before: style recalculation 4.6–5.4 s of the 9 s, main thread busy 5.7–6.6 s, 7–9 frames over 33 ms.
- After: style recalculation 0.53–0.61 s, main thread busy 1.4–1.8 s, 0–1 frames over 33 ms. Paint 49 ms and raster 134 ms over the whole run; idle hero with the pointer moving: no paint, no layout.

Causes fixed:
- `MotionEngine` wrote `--scroll-p` on `<html>` every frame, which restyled the whole page each frame. The progress ball is now moved directly (`data-scroll-ball`).
- The loop read `getBoundingClientRect()` and wrote `--p` element by element (layout thrash). Positions are now measured once (and on resize, debounced) and the loop does no DOM reads; values are written only when they change; parallax layers more than 1.6 viewports away are skipped.
- The loop and the cursor now sleep when scroll and pointer are still, and wake on scroll, wheel or pointer events.
- Cursor: dropped `mix-blend-mode: difference` (forced blending of the whole page under it); white ring with a thin dark edge, yellow when over links.
- Film grain: the live SVG `feTurbulence` noise is replaced by a pre-rendered 192px PNG tile (`public/brand/grain.png`, 57 KB) on its own layer.
- Journey ball: `filter: drop-shadow` (repainted the SVG every frame) replaced by a halo circle.
- Header: scroll attributes written only on change.
- Sections out of view (`data-offscreen`, IntersectionObserver) pause their CSS loops.

Commands: `npm run check` exit 0; overflow check on home, About, Fields, Projects and Contact: none; scroll-driven sections re-screenshotted (countdown, zoetrope, journey, word ink, chamber) and behave as before.
Not tested: real GPUs and low-end laptops, Safari/Firefox, phones. Headless numbers are relative, not what a visitor sees. Note `npm run dev` (development mode) is much heavier than the production build; judge smoothness on `npm run build && npm start -w @as/web` or the deployed site.

## Session handoff: homepage sections redesign, 8 November 2026

Request (Malek): keep the look, feel and hero, but give every section under the hero its own artistic design; the previous sections looked AI-generated. Skills used: frontend-design and the VectorLab UI/UX skills (motion, reduced-motion, viewports, typography, colour-palette, anti-slop).

Concept: each section borrows one tool from the animation craft, in the brand palette only.
- Video: a 2.39:1 cinema screen under a projector beam. A film countdown leader (rings, crosshair, sweep, digits 3-2-1 in the page's numerals) is scrubbed by scroll, then the honest pending message appears.
- About: a white sheet of animation paper with peg-bar holes on a light table. The statement is "pencilled" in light green and inked to black word by word; the four aims carry red and green onion skins (traditional previous/next-drawing colours) that settle onto the key pose.
- Objectives: a zoetrope. On wide screens with motion the section pins and scrolling turns the five-sided drum (green slit band) one objective at a time; elsewhere it is a flat strip.
- Fields: one large list. On hover or keyboard focus each name moves the way its technique moves (2D line boil, 3D extrusion, stop-motion held-frame hops, hybrid half fill/half outline) and a light-table sheet shows that field's drawing (CSS `:has`, no JS). Narrow screens show a thumbnail per row.
- Membership: the journey is now the bouncing-ball exercise (lower bounce each time, ghost balls marking the spacing chart, squash marks at each station); used on the Membership page too. Types are a fanned hand of membership cards in the four primaries (new `components/sections/MembershipDeck.tsx`; the Membership page keeps `MembershipTypes`).
- Projects: the featured initiative as a cinema poster in a marquee frame with a billing block; the bulbs chase on hover.
- Governance: the General Assembly as a hemicycle of seats that fills as you scroll, title in the chamber; the Board empty state sits in a dashed "reserved" frame.
- Partners and news: end credits rolling into the footer's closing line.
- Removed the generic fade-up reveals and identical rounded cards from the homepage.

Commands and results (8 Nov):
- `npm run check`: exit 0 (lint, typecheck, contracts 3, API 19, web 12 tests, build).
- Overflow (`scrollWidth` vs viewport): home ar/en at 375, 390, 768, 1280, 1440 and Membership ar/en at 375 and 1280: no page overflow. Found and fixed: the card deck was 64px wider than the viewport at 1280 in English (aspect-ratio min-size; columns now `minmax(0, 1fr)`).
- Screenshots reviewed: every section at ar 1440, en 1280, ar 390; countdown mid-run (Arabic digits); all four field hover effects with the matching drawing; poster hover; reduced motion (en 1280: no pin, flat strip, finished states, message visible).
- Not tested: Safari and Firefox (the countdown uses CSS `mod()` and the field preview uses `:has()`), real touch devices, screen readers, performance of the 3D drum on low-end hardware.

Next: Malek's review of the homepage sections. Then Stage 2.

## Session handoff: public-site redesign, 5 November 2026

Request (Malek): save the green hero for a future coming-soon page; redesign the whole public site using https://mbvision-kw.com/ as the reference for animation, scrolling, interactivity and background; use the Drive material and the design skills.

Reference study (Chrome, 5 Nov): intro gate on black with light streaks flying out of the logo and two entry choices; inertial smooth scroll; a continuous illustrated world with parallax layers and content floating over it; a circle cursor follower; minimal header with a side-drawer menu; strong per-page art. Only the experience was taken: no MB Vision art, text, logo, navy palette or layout copied.

Changed:
- Saved hero: `apps/web/src/components/coming-soon/` (BounceStage, bounce geometry, HeroScene, hero CSS and `ComingSoonHero` section), unchanged in look. Preview at `/ar/preview/coming-soon` and `/en/preview/coming-soon` (noindex, unlinked). The bounce unit tests now import from there.
- Night-studio world: public layout wraps pages in `.world` (tokens.css): logo-black canvas, brand colours as light sources, film-grain overlay, dark dev strip. Member/admin stay light. New semantic tokens `--as-surface`, `--as-accent-*`; public CSS modules use `--as-ink`/`--as-surface` instead of literal black/white.
- Motion engine (`components/motion/MotionEngine.tsx`): Lenis 1.3.27 smooth wheel scroll (touch stays native), `[data-speed]` scroll parallax, `[data-depth]` pointer depth, `[data-progress]` scrub values (`enter`, normal, `pin`) and `--scroll-p`. One rAF loop; uses the `translate` property so layers keep their own transforms. Off under reduced motion.
- Intro gate (`IntroGate.tsx`), once per browser session: logo on black, canvas streaks in brand colours flying outward, the ball drops and bounces, then "Enter" or "Enter in English"/"الدخول بالعربية"; Escape enters. Armed by the inline head script only when motion is allowed and the session hasn't seen it; page behind is inert while open.
- Cursor (`Cursor.tsx`): ring that trails the pointer and squashes in the direction of travel like the ball; mouse only; system cursor kept.
- Scroll-progress ball on the inline-end edge (wide screens).
- Header: logo (colour-on-dark variant), language, membership CTA and Menu; hides on scroll down, returns on scroll up. Side drawer from the inline end with big links, ball marker, CTA, policies/sign-in/language; focus trap via `inert`, Escape, focus return.
- Footer: big "لنصنع / الحركة / معًا" (en "Let's / make it / move") statement with CTA (the homepage's closing invitation), link columns over the Drive contour-line art with parallax.
- Home rebuilt as one journey: hero planet (the logo ball) inside brand contour rings with two orbiting balls, parallax blobs/arc/ball clusters and the Drive ribbon; video screen (honest pending); About statement that lights up word by word with scroll; objectives as a pinned horizontal reel on wide screens (stack elsewhere or under reduced motion); fields as tilting portals; membership journey where the ball rolls along a wave through the five numbered steps; types, featured initiative, governance, partners and news empty states.
- Inner pages: new PageHero (contours, blob/planet, ball cluster, feathered Drive art, colour glow per page); sections and page styles adapted to dark.
- Vectors redrawn from Visual Elements 3 (planet, blobs, arc) and 2/4 (contours) without the navy: `components/art/Shapes.tsx`.
- Dictionary: `intro`, `home.hero.scroll`, `footer.statement`. Removed the old home film strip (`components/home/`).

Commands and results (5 Nov):
- `npm run check`: exit 0. Tests: contracts 3, API 19, web 12. `npm audit`: 0 vulnerabilities after adding lenis.
- Horizontal overflow sweep (headless Chrome, production build): 10 routes × ar/en × 375/1280 = 40 checks, `scrollWidth == clientWidth` on all. One defect found and fixed (About contour rings bled 288 px in RTL).
- Scripted interaction (production build): gate shows with focus on Enter and the page inert, Escape enters and stores the session flag; drawer opens with focus inside, Escape closes and focus returns to Menu, at 1440 and 390. Reduced motion: no gate, no Lenis, no parallax engine, cursor hidden, objectives stacked, journey drawn complete, drawer works.
- Contact form: blur validation and always-enabled submit pass in the browser; POST via the web origin returns 202 (synthetic message stored) and a cross-origin POST returns 403.
- Screens reviewed by screenshot: home scroll sequence AR 1440 and EN 390/1440, gate, drawer AR 1440/EN 390, all inner pages AR 1440, reduced-motion home EN, contact EN, saved hero preview.
- Not checked: Safari, Firefox, real phones/touch, screen readers, performance budget (D-A07). The streak canvas and parallax loop run continuously while visible.

Skills used: frontend-design (plan and self-critique), VectorLab motion, reduced-motion, viewports, colour-palette, typography, anti-slop, page-patterns (marketing route types), empty-states, forms, keyboard (drawer/gate focus), and the Chrome browser skill for the reference study.

Documented exceptions: dark-mode artwork glows (brand light sources) and decorative infinite loops (ring/orbit rotation, scroll cue) are artwork, not chrome, and stop under reduced motion; gate/hero entrance durations above 300 ms are artwork exceptions listed in home.module.css and motion.module.css.

Next: Malek's review of the redesign. Then Stage 2.

## Session handoff: Stage 1, 2 November 2026

Stage/task: Stage 1 Foundation and bilingual shell (docs/PLAN.md). Git initialized on `main`; nothing committed, no remote.

Changed files and behavior:
- npm workspaces: `packages/contracts` (zod contracts: locales, health/readiness, error format), `apps/api` (Express 5 + Mongoose 9), `apps/web` (Next.js 16 App Router). `apps/worker` deferred until the first durable job.
- API: validated environment (fails with variable names only; production refuses mock/sandbox payment and email modes and non-https origin), explicit bind host, pino logs with request IDs and redaction of cookies/authorization/password/token/secret fields, helmet, 100 kB JSON limit, structured error body `{error:{code,message,requestId,fields?}}`, `GET /api/v1/health` (liveness, no DB) and `GET /api/v1/ready` (503 unless MongoDB is connected and is a replica set), graceful shutdown.
- Local MongoDB 8.0 single-node replica set `rs0` via docker-compose (self-initiating healthcheck, bound to 127.0.0.1).
- Web: `/ar` (RTL) and `/en` (LTR) with document-level `lang`/`dir`; locale redirect from unprefixed paths (Accept-Language, Arabic default); language switch preserves the equivalent page; public header/nav (collapsible on mobile, Escape closes), footer, skip link; home shell plus placeholder pages for about, fields, projects, news, membership, partners, contact, policies; member and admin shells (`noindex`, robots disallow); admin shell shows live API/DB readiness; localized 404; canonical and hreflang alternates; typed Arabic/English dictionaries; provisional editable tokens in `apps/web/src/styles/tokens.css`; reduced-motion handling.
- CI: `.github/workflows/ci.yml` runs npm ci, lint, typecheck, test, build (Node from `.nvmrc`). It has not run on GitHub because there is no remote.
- Docs: docs/DEVELOPMENT.md (setup, commands, env, topology), CLAUDE.md commands/architecture.

Commands run and actual results (local, Node 24.4.0, npm 11.4.2, Docker 28.3.0):
- `npm install`: OK. `npm audit`: 16 moderate, all `minimatch` inside the ESLint/typescript-eslint dev toolchain; no runtime dependency affected. Not force-fixed (would downgrade linters).
- `npm run check` (lint + typecheck + test + build): exit 0. Tests: contracts 3/3, api 12/12, web 7/7. `next build` compiled; 25 static pages generated; admin is dynamic.
- `npm run test:integration` against the docker replica set: 3/3 (replica set detected, multi-document transaction commits, failed transaction rolls back).
- Missing env: API prints all four missing variables and exits 1; web build fails naming `API_INTERNAL_ORIGIN` and `PUBLIC_ORIGIN`. Production with mock modes and http origin exits 1 with three named problems.
- Live dev smoke (curl): `/api/v1/ready` direct and through the web rewrite returns ready; `/` redirects 307 to `/ar` (no preference) or `/en` (en-US); `/news` goes to `/en/news`; all shell routes 200; `/ar/nope` and `/en/a/b` 404; robots.txt disallows member/admin/api.

Screens/routes visually inspected:
- Chrome desktop (1680 px): `/ar` and `/en` home, `/ar/admin`; keyboard Tab shows the skip link and focus rings; the language switch goes from /ar to /en on the same page.
- 390 px emulated (Chrome DevTools Protocol): `/ar`, `/en`, `/ar/admin`, `/en/admin`, `/en/member`, `/ar/news`; no horizontal overflow (scrollWidth equals viewport); Arabic text shapes correctly; mobile menu opens, closes on Escape and lays out RTL.
- Defects found and fixed: field names had loose wrapped leading; the admin sidebar stretched to full height on mobile; the API silently shared port 4000 with another local app (now bound to an explicit host and port 4100).
- Not inspected: tablet widths, Safari/Firefox, real touch devices, screen readers, contrast measurement.

Known failures/limitations:
- No frontend-design or UI/UX skill is installed in this Claude Code environment (only general artifact/document skills). The shell was built from docs/DESIGN_BRIEF.md alone and is explicitly provisional; D-A01 stays open.
- The Society Drive URL has not been supplied (D01). No Society logo, palette, fonts or card template were used. The flipbook mark, palette and Readex Pro typeface are provisional explorations, labeled on-screen.
- No authentication: member/admin pages are empty shells and expose no data; access control is Stage 2.
- Interface Arabic/English copy is developer-drafted, not approved (D08). Home copy is labeled as sample.
- `next/font/google` downloads Readex Pro at build time, so builds need network access.
- The CI workflow has not run on GitHub. It runs only unit tests (not the replica-set integration test).
- The dev-only Next.js rewrite proxies `/api/v1`; the production reverse proxy is not configured (hosting D06).

Decisions recorded: see docs/DECISIONS.md "Stage 1 engineering assumptions".

Next bounded task (proposed Stage 2 start): users/sessions/auth tokens with secure HttpOnly server-side sessions, CSRF/origin checks, email verification and password reset through a development-only local mail adapter, roles (member/editor/admin), and administrator TOTP MFA with recovery codes. All of this comes before any protected publishing. In parallel, Malek supplies the Drive URL and enables frontend-design and UI/UX skills for the homepage design checkpoint (prompts/03).

## Session handoff: brand and homepage concept, 3 November 2026

Stage/task: Malek's answers to the open questions; Society Drive inventory; brand applied; homepage concept (DESIGN_BRIEF checkpoints 1–3).

Changed files and behavior:
- Drive inspected in full. Inventory and gaps: docs/BRAND_ASSETS.md.
- Six files downloaded with Malek's approval to `brand-source/drive/` (git-ignored): the logo .ai/.pdf masters, the mono PDF, two full-colour PNGs and icons.pdf. Logo SVGs converted with poppler (installed with approval) into `apps/web/public/brand/logo/`.
- Tokens rebuilt from the guideline (`tokens.css`): primary palette, navy, gradients, Cairo weights. Cairo replaces Readex Pro.
- Header, footer and member/admin frame use the real logo, enforcing the guideline's 130 px minimum. The nav drops "Home" (the logo links home). Mobile header is two columns with a full-width dropdown menu.
- Homepage concept:
  - Interactive bouncing-ball hero: onion skin with past frames red and future frames green, timing chart, play/replay, frame slider, mirrored in Arabic, plays once at 12 fps, no autoplay under reduced motion.
  - "One ball, four techniques": four original SVG illustrations in a navy film strip.
  - The four membership types condensed from the Society's materials, on a navy panel with the member-card sweep.
  - The Challenges Initiative as the featured initiative.
  - All copy is marked "Proposed copy".
- Artwork manifest `apps/web/src/config/artwork.ts` and docs/ARTWORK_REPLACEMENT.md.
- Lint stack moved to ESLint 10 plus maintained plugins, and minimatch is overridden to 11.0.4, so `npm audit` reports 0 vulnerabilities (was 16 moderate). CI now runs `npm audit --audit-level=moderate`. TypeScript stays on 6.0.3. Details in docs/DECISIONS.md.

Commands run and actual results:
- `npm audit`: found 0 vulnerabilities.
- `npm run check`: exit 0 (contracts 3/3, api 12/12, web 12/12 including 5 bounce-geometry tests, build compiled).
- `npm run test:integration`: 3/3.

Screens/routes visually inspected:
- `/ar` and `/en` at 1440 px and 390 px (Chrome DevTools Protocol): no horizontal overflow, Arabic shaping correct, nav on one line at desktop, mobile menu opens and closes (Escape).
- Real Chrome at 1680 px: hero replay, keyboard Home/Arrow scrubbing, and slider `aria-valuetext` ("7 of 24").
- Reduced motion emulated: stays on frame 24/24 with no autoplay; normal motion autoplays (16/24 at about 1 s).
- Note: CDP full-page capture with `captureBeyondViewport` shifted RTL pages. The tool was fixed; the page itself was fine.

Known limitations:
- The UI/UX skill is still not installed. Only frontend-design was available and used, so D-A01 isn't fully met.
- RTL motion mirrors the stage. Whether the Society prefers the logo's fixed left-to-right direction is a design-review question.
- Supporting navy and blue values are screen-sampled and need confirmation. The RNS Sanz web licence is missing, so English uses Cairo.
- No dedicated membership-card design exists in the Drive. The proposal is to adapt the "Special Member" business card in Stage 5.
- Homepage copy and membership descriptions are proposals awaiting Society approval. Other public pages still use shell placeholders.
- No tablet, Safari/Firefox, real-device or screen-reader pass yet. Contrast is designed to tokens (navy/ink on white, white/yellow on navy) but not measured with a tool.

Next bounded task: Malek's design review of the homepage concept (two agreed rounds). After that, Stage 2 auth/sessions/MFA, or apply the approved direction to the other public pages.

## Session handoff template

Date:
Stage/task:
Changed files and behavior:
Commands run and actual results:
Screens/routes visually inspected:
Known failures/limitations:
Decisions recorded:
Next bounded task:

Do not mark payments, signature, client acceptance or production launch complete without direct evidence.

## Session handoff: public site, content structure and redesign, 3–4 November 2026

Status: complete for review. Web, API and contracts build and pass all checks.

Malek's decisions:
- UI/UX skills (VectorLab) installed and used.
- No sampled navy or blue.
- Use the Drive fonts as declared: Cairo for Arabic, RNS Sanz for English.
- Official domain is https://animation.org.sa/.
- Redesign the header.
- More art, animation and interactivity, with the Drive Visual Elements as artwork throughout.

Changed:
- **Brand:** palette limited to guideline primaries, white and logo black. Cairo 400/600/700/900 and RNS Sanz 500/600/700/800, switched per page language.
- **Visual Elements:** web derivatives in `public/brand/elements/` and 15 brand icons in `public/brand/icons/`, regenerated by `scripts/brand/*.mjs`. The fixes are scripted: the characters art had a 28% white layer, and the sheet pieces had outline frames.
- **Header ("studio slate"):** logo tab hanging from the top edge, a fixed floating nav pill with the brand ball following hover and the current page, a full-screen green menu sheet below 1280px (focus moved in, rest of page inert, Escape closes, focus returns). Dev notice moved to a fixed bottom strip.
- **Shared content module** `apps/web/src/content/` with status per item (supplied/draft/pending). The pages render honest pending states from it.
- **Homepage, 12 sections:**
  - hero (green field, lightbox disc with the bouncing-ball exercise, Society character crescent, pointer parallax, one-shot entrance);
  - video pending frame (no fake play button);
  - about; five objectives with brand icons and a gradient sweep;
  - draggable fields film strip;
  - membership journey (ball travels with scroll), types and fee note;
  - featured initiative; governance (board empty state, General Assembly draft and voting note);
  - partners and news empty states; closing band on Visual Element waves.
- **Pages:** About (anchor nav), Animation Fields (4 sections, roles), Membership (types, plans and benefits pending, journey, FAQ), Projects list and detail, News and events (filters, filtered-empty, detail template), Partners, Contact, Policies (5 pending templates). The generic `[section]` placeholder route was removed.
- **Contact vertical slice:** `POST /api/v1/contact` with a shared zod schema (CR/LF rejected in single-line fields), same-origin check, per-connection rate limit, honeypot, MongoDB `contactMessages`, and a dev-only mock mailer. The API refuses to start with EMAIL_MODE sandbox or live until a real adapter exists.
- **Field illustrations** recoloured to black and brand greens.

Commands and results:
- `npm audit`: 0 vulnerabilities.
- `npm run check`: exit 0 (contracts 3, api 19 including 7 contact tests, web 12, build OK).
- `npm run test:integration`: 3/3.
- Production build served locally for review (temporary `next start` and API, stopped afterwards).
- Contact end to end through the web origin: 202, stored with delivery "stored". Cross-origin: 403.

Visual and interaction review (headless Chrome via CDP; real Chrome unavailable for resizing):
- No page-level horizontal overflow on all 10 public routes × AR/EN × 375 and 1280 (40 measurements).
- Screenshots reviewed: home AR/EN desktop and mobile; about AR; fields EN; contact EN; membership AR mobile; menu sheet AR mobile.
- Mobile menu: dialog, focus inside, `main` inert, Escape closes, focus returns (scripted check).
- Contact form: no error while typing in a pristine field, error on blur, cleared on focus, submit never disabled, empty submit focuses the first field (scripted check).
- Earlier sessions verified reduced motion (no autoplay) and keyboard stepping on the stage; the global and scoped reduced-motion overrides are unchanged.

UX audit (VectorLab ux-audit, catalog defaults; no `.ux-profile.md`):
- **Hard-gate fails found and fixed:** non-verb link labels; colour and border transitions.
- **Documented exceptions:**
  - Brand weights 800/900 override the typography skill's weight cap, by Malek's instruction.
  - "About the Society" is a noun-phrase label, as Malek specified.
  - Artwork motion durations are longer than the chrome tokens, documented in tokens.css.

Known limitations:
- RNS Sanz web licence unconfirmed (© Yorlmar Campos, fsType 8).
- Contact messages are stored but not emailed (no provider chosen).
- Member and admin areas are still shells. Statuses, card and payments arrive with Stages 2–5.
- Projects use a brand visual element as an illustrative cover, labelled as such.
- The scroll-linked drift and journey ball need CSS scroll timelines (Chromium; static elsewhere).
- No Safari or Firefox pass yet, no real device, no screen-reader pass.

Content Malek/the Society still needs to provide:
- the introduction video;
- official vision and mission;
- board names, roles and portraits;
- approved General Assembly text;
- membership plans, fees, duration and benefits;
- approved partners (names, logos, links);
- news and events;
- policy texts (terms, privacy, membership, payment/refund, card use);
- Society email, phone, address and social links;
- registration/participation links for initiatives;
- confirmation of the RNS Sanz web licence;
- approval of all draft copy (marked on-page).

Next bounded task: Malek's design review of the homepage and pages. Then Stage 2 (auth, sessions, roles, admin MFA) and the CMS that replaces `src/content/`.
