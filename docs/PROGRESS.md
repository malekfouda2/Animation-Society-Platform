# Project progress

Status: Stage 1 done. Design checkpoint redone as a full "night studio" redesign after Malek named mbvision-kw.com as the design reference (5 Nov 2026); homepage sections below the hero redesigned individually on 8 Nov 2026. Awaiting Malek's design review.
Current stage: Stage 1 closed (8 Nov 2026). Design checkpoint pending Malek's review. Stage 2 (identity and publishing) not started.
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
