# Acceptance checklist

These are implementation checks, not proof of contractual acceptance. Fill result/evidence during work; all start NOT RUN. Use synthetic records and record tested browsers, viewports and environment. Malek/client sign-off remains separate.

| ID | Required outcome | Result/evidence |
| --- | --- | --- |
| A01 | Clean documented install/start/build and validated environment configuration | PARTIAL 2026-11-02: docs/DEVELOPMENT.md; `npm run check` exit 0; missing/invalid env fails with named variables; production rejects mock modes. Fresh-clone `npm ci` and GitHub CI run not yet done. 2026-11-03: `npm audit` 0 vulnerabilities; CI gates on it. 2026-11-08: fresh clone of the Stage 1 commit → `npm ci` (0 vulnerabilities) → env from the .example files → `npm run check` exit 0 (contracts 3, API 19, web 12, build) and `npm run test:integration` 3/3. The clone exposed a defect, fixed: `lint` did not build `@as/contracts` first, so lint failed on any clean checkout (and would have failed CI). GitHub CI run still pending (repo not pushed). |
| A02 | Public/member/admin pages switch Arabic/English with correct lang/dir and usable RTL/LTR | PARTIAL 2026-11-02: shells verify lang/dir and equivalent-page switching in Chrome at 1680 px and 390 px. Real content, forms and other browsers not yet covered. |
| A03 | Published content visible; drafts and private pages absent from public API/indexing/cache | NOT RUN |
| A04 | Content changes persist; equivalent locale links, titles and descriptions work | NOT RUN |
| A05 | Verification/reset tokens expire and cannot be reused; session revocation works | NOT RUN |
| A06 | Admin MFA enrollment, login, recovery and sensitive-operation checks work | NOT RUN |
| A07 | Member A cannot read/change member B application, card, files, payment or export | NOT RUN |
| A08 | Editor cannot manage memberships, payments, roles or sensitive exports by direct API calls | NOT RUN |
| A09 | Apply, request corrections, resubmit, approve and reject preserve expected state/history | NOT RUN |
| A10 | Unapproved member cannot bypass approval with direct checkout/API manipulation | NOT RUN |
| A11 | Server rejects client-modified price, currency, plan eligibility and entitlement dates | NOT RUN |
| A12 | Verified success grants exactly one membership period; return-page visit alone grants none | NOT RUN |
| A13 | Invalid signatures, wrong amounts/currency/account/order and forged callbacks are rejected | NOT RUN |
| A14 | Duplicate/concurrent/replayed/out-of-order events do not double-activate or undo reconciled success | NOT RUN |
| A15 | Failed/canceled checkout and delayed webhook recover without false activation; status reconciliation works | NOT RUN |
| A16 | Early/expired renewal, duration boundaries and reminders follow approved rules using clock-controlled tests | NOT RUN |
| A17 | If recurring selected: consent, renewal success/failure, cancellation and idempotency work in provider sandbox; otherwise record approved deferral decision | NOT RUN |
| A18 | Portal shows correct profile/status/payment history/renewal eligibility | NOT RUN |
| A19 | Arabic/English PDF renders shaped names/fonts/photo/dates and scannable QR without clipping | NOT RUN |
| A20 | QR returns approved minimal fields; old tokens revoked; expired/suspended members never show active | NOT RUN |
| A21 | Admin suspension, extension and reissue require authority and retain reason/history | NOT RUN |
| A22 | Email jobs survive process restart, retry within limits and avoid known duplicate business events | NOT RUN |
| A23 | Contact form safely delivers to configured mailbox; no unintended ticket module | PARTIAL 2026-11-04: validation, CR/LF rejection, same-origin, rate limit and honeypot tested (7 API tests + E2E). Messages stored; mailbox delivery awaits an email provider. |
| A24 | Search/filter/counts/CSV reconcile to permitted dataset; formula injection handled | NOT RUN |
| A25 | Keyboard, focus, labels/errors, contrast, zoom and representative mobile/tablet/desktop layouts reviewed in both languages | NOT RUN |
| A26 | Invalid/oversized uploads, unauthorized files, injection attempts, CSRF/session misuse and sensitive rate limits checked | NOT RUN |
| A27 | Staging/production credentials/data separate; no live mock modes, committed secrets or real data in fixtures/logs | NOT RUN |
| A28 | Database and files restored in isolation; sample relationships, counts and authorized access verified | NOT RUN |
| A29 | Deployment/rollback/API/admin/recovery docs usable; licences and accounts documented | NOT RUN |
| A30 | Launch approvals, live configuration and handover/training evidence recorded by authorized humans | NOT RUN |


Additional design acceptance checks, also initially NOT RUN:

| ID | Required outcome | Result/evidence |
| --- | --- | --- |
| D-A01 | Actual frontend-design and UI/UX skills used and recorded for interface work | PASS (dev) 2026-11-04: frontend-design 1.1.1 and VectorLab UI/UX skills (page-patterns, motion, reduced-motion, anti-slop, typography, colour-palette, forms, empty-states, viewports, ux-audit) used and recorded in PROGRESS. |
| D-A02 | Society asset inventory completed; logo/palette/fonts/card template traced to supplied sources | PARTIAL 2026-11-04: inventory in docs/BRAND_ASSETS.md. Logo, palette, Cairo, RNS Sanz, Visual Elements and icons traced to the Drive. Card template still a proposal. |
| D-A03 | Homepage has a distinct animation-specific visual voice and is reviewed in Arabic/English and mobile/desktop | PARTIAL 2026-11-05: night-studio redesign (mbvision-kw.com reference) self-reviewed by screenshot in AR/EN at 390/1440; overflow-free at 375/1280 on all public routes. Awaiting Malek's design review. 2026-11-08: each homepage section redesigned around an animation-craft device (countdown leader, animation paper and onion skins, zoetrope, light table, bouncing-ball path, membership cards, poster, assembly chamber, end credits) with one-shot entrances; screenshots AR 1440/390 and EN 1280/390, reduced motion EN 1280; no overflow at 375/390/768/1280/1440. Awaiting Malek's review. |
| D-A04 | Original temporary art and motion exist as usable files/components; provenance/status recorded | PARTIAL 2026-11-03: 4 SVG files + code-drawn hero, manifest with status and provenance. |
| D-A05 | Replace one artwork through the manifest without changing layout logic; verify crop, alt text and responsive behavior | NOT RUN |
| D-A06 | Motion has reduced-motion/static fallbacks; content and navigation remain usable by keyboard/touch | PARTIAL 2026-11-05: under reduced motion the gate, smooth scroll, parallax, cursor and pinned reel are off and scrubbed sections show their final state (scripted check); gate and drawer focus/Escape/inert scripted at 1440 and 390. No real touch device or screen reader tested. |
| D-A07 | Artwork media is optimized; dimensions reserved; measured performance and visible defects recorded honestly | PARTIAL 2026-11-08: artwork is WebP/SVG (largest 224 KB), images carry width/height. Scroll measured in headless Chrome (production build, 9 s wheel scroll, 3 runs): style recalculation cut from ~5.0 s to ~0.6 s, 0–1 frames over 33 ms (was 7–9); details in PROGRESS. Real devices, Lighthouse/Core Web Vitals and Safari/Firefox not measured. |
| D-A08 | Cinema reference informed concepts only; no copied visual identity or unapproved feature expansion | NOT RUN |
| D-A09 | Supplied membership-card design implemented with readable bilingual dynamic fields and scannable QR | NOT RUN |

Suggested test layers: focused service tests for state/date rules; API tests against a real local/CI replica set for permissions and transaction/idempotency; browser journeys for bilingual application/payment/card flow; manual PDF/QR/keyboard checks; provider sandbox validation. Select maintained compatible test tools during scaffolding; do not promise third-party certification or manufacture passing results.
