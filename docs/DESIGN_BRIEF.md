# Animation Society art direction

## Required creative outcome

Malek's direction: the website must be highly artistic in its colors, compositions, artworks and interactions. It must express the identity and creative community of an animation society, feel alive and enjoyable to explore, and avoid the generic appearance associated with automatically generated websites. This direction applies to all website design work, within the agreed MVP feature scope.

Treat the public site as a cultural publication and animation showcase. Give it a recognizable visual voice through deliberate composition, typography, artwork and movement. Useful member/admin workflows should share that identity while remaining clear, calm and efficient.

## Required skills workflow

Before designing or revising any interface, discover and read the frontend design and UI/UX skills available in the Claude Code environment. Use both disciplines: visual craft and implementation from the frontend skill; navigation, task flows, accessibility and interaction states from the UI/UX skill. Exact skill names vary; do not invent an invocation or claim a skill was used when it was unavailable.

Record the actual skills used in the session handoff. If either is unavailable, tell Malek what is missing and ask him to enable/provide it before claiming completion of that design task. Continue independent engineering and asset inventory work. This pack does not install skills or include their implementations.

## Brand source and assets

The Society's Google Drive folder is intended to supply the logo, visual identity, membership card designs and related assets.

Drive URL: NOT PROVIDED IN THE CHAT YET. Ask Malek for the link, or accept a local asset-folder copy. Never invent the URL or claim the assets have been inspected.

When available, inspect the identity guide and source files before selecting final colors/fonts or generating branded artwork. Inventory logo variants, color specifications, typography, illustration language, card templates, images, videos and motion files. Record filenames, intended use, available formats and any licensing/attribution constraints. Download only relevant assets through an authorized method; preserve originals. If access is blocked, identify the missing item and continue independent work rather than silently substituting a brand.

Brand hierarchy: Malek's latest direction > supplied Society identity rules and approved designs > original temporary art built to complement them. The Cinema Association is not a visual source. Malek Fouda's proposal logo is not the Society logo.

The supplied membership card design should drive the fixed bilingual PDF template. Adapt dynamic fields, fonts, safe margins and QR readability carefully. If the folder contains several card variants, select the approved MVP template rather than expanding scope to a card designer or multiple templates without agreement.

## Concept reference

Reference: https://cinemaassoc.com/ (also https://www.cinemaassoc.com/).

Use this to understand the purpose and visitor journeys of a cultural association: discover its mission, explore current activity and initiatives, understand membership benefits and find a route to join. Apply those concepts to the existing Animation Society content modules. Do not copy the site's palette, typography, layout compositions, imagery, logos, text or animation treatment. Do not import additional functions such as commerce, ticketing or venue bookings.

Research note, 2 November 2026: direct page retrieval exposed a loading shell. Search-indexed first-party homepage/about content showed association information, activity discovery, news and membership pathways. These are conceptual observations, not a verified audit of every current interaction or screen. Claude should inspect the reference with available browsing tools before making more detailed claims.

## Original visual direction

Develop a coherent animation-specific art direction rather than stacking unrelated effects. Possible visual vocabulary includes storyboard framing, illustrated sequences, layered cut-paper shapes, character silhouettes, production sketches and frame-by-frame transitions. These are options, not instructions to use them all. Select motifs that fit the Society assets when available.

Use expressive color relationships derived from the identity. Give Arabic typography equal creative attention to English; do not treat RTL as a late mirror of an English composition. Use varied editorial rhythm, intentional whitespace, strong art placement and a limited set of repeated motifs to connect pages.

Avoid template habits: identical rounded cards for every section, decorative gradients with no relation to the identity, generic blobs, repetitive icon-feature grids, stock business illustrations, fake counters/testimonials, and a generic SaaS hero. Individual components remain appropriate when they solve a real task; the objection is to defaulting to a template aesthetic.

The homepage should make the Society's purpose apparent quickly, showcase its creative character, lead into initiatives/news and make membership easy to understand. Navigation and calls to action must remain recognizable. Public detail pages should have thoughtful artwork and typographic hierarchy, not just a reused dashboard card.

## Original temporary artwork and animations

Malek explicitly authorizes Claude to create original temporary artwork and animation designs for this project. He may supply replacements later. Deliver actual usable asset files or code-based artwork, not empty gray placeholders or descriptions presented as completed images.

Initial candidate set, to be adjusted to the approved layout:

- One distinctive hero illustration/composition, with a lightweight motion treatment and a static fallback.
- Four related illustrations representing 2D, 3D, stop motion and hybrid animation.
- A small reusable family of decorative motifs or section transitions.
- A membership invitation illustration if it improves the composition.

Keep one cohesive visual language. Do not invent a new official Society logo, imitate a named living artist, reuse copyrighted characters, or portray invented artworks as the Society's real productions. Use original subjects. Mark generated material as temporary in development records and asset metadata; do not claim it is approved client artwork. Demo initiative thumbnails must not imply genuine projects.

Use available image-generation tools/skills for original raster illustrations where suitable. If none are available, create original SVG/CSS illustrations and code-based motion, clearly report the capability limit and request access only if raster generation is necessary to the selected direction. Never pretend to call image-generation tools. Generated output is subject to human review and applicable tool terms; do not invent a blanket rights guarantee.

Prefer lightweight SVG/CSS/transform/opacity motion for suitable effects. Use an additional animation library only where it materially improves the design and is compatible with the app. Rich 3D/WebGL or a full animated film is not automatically part of this brief. Artwork is a design deliverable, not an AI-generation feature for website visitors.

## Replacement contract for assets

Keep artwork out of page-specific business logic. Create a typed asset manifest, for example apps/web/src/config/artwork.ts, and store replaceable assets under apps/web/public/artwork/. The exact paths can be adapted to the existing project and then documented.

Each entry needs a stable key, source path, optional mobile variant, width/height or aspect ratio, fit/crop rules, focal point where needed, localized alt text or decorative status, poster/static fallback, motion behavior and source/status (temporary original, supplied, approved). Do not put private Drive URLs or access tokens into public metadata.

Suggested keys: homeHero, field2d, field3d, fieldStopMotion, fieldHybrid, membershipInvitation and sectionMotif. Keep animation wrappers independent of image content where possible so replacing an illustration does not require rewriting the layout. A frame sequence/video may need different metadata; document that explicitly.

Provide docs/ARTWORK_REPLACEMENT.md listing each final file, display locations, dimensions, format, edit instructions and any motion-specific constraints. Deliver editable sources for code-generated art and available source prompts/settings for generated images in development documentation. Replacement should normally mean updating one file/manifest entry, then checking the crop, alt text and mobile layout. No encoded raster blobs embedded in components.

## Interaction quality

Choose a few memorable interactions with a clear purpose: an animated hero reveal, illustrated hover/focus responses, a responsive art composition or a considered transition into animation fields. Ensure touch and keyboard equivalents. Keep forms, payment and member management predictable and fast.

Honor prefers-reduced-motion. Provide static fallbacks; do not hide content until animation runs. No scroll hijacking, obstructive custom cursor, autoplay sound, flashing sequences or mandatory drag-only navigation. Longer automatic motion must have appropriate pause/stop behavior. Prefer natural scrolling, limited animation concurrency and media loaded only when useful.

Reserve artwork dimensions to avoid layout shifts. Optimize image sizes/formats and lazy-load below-fold art; give the hero a deliberate loading strategy. Test on a representative mobile device or constrained viewport, not just a desktop screenshot. Do not fabricate performance scores.

## Design checkpoints

1. Read available frontend and UI/UX skills and inspect supplied assets; record missing inputs.
2. Write a short art-direction rationale: palette provenance, Arabic/English typography, compositions, artwork family and motion rules.
3. Create one representative homepage concept in Arabic/English and desktop/mobile, including real temporary original art. Use this in the existing design-review process before propagating it to every public page.
4. Apply the direction consistently to about, animation fields, editorial details, membership and member screens; keep admin tasks usable.
5. Review actual screenshots and working interactions. Check Arabic shaping, crop choices, hierarchy, touch, keyboard, contrast, reduced motion and layout performance. Fix the design rather than accepting the first generated result.
6. Complete the replacement guide and report which assets are temporary, supplied or approved.

No design approval is inferred from the presence of this brief. Missing Drive access blocks final brand approval, but it does not block infrastructure or clearly labeled provisional original-art exploration.
