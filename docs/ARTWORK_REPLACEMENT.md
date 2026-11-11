# Artwork replacement guide

All replaceable artwork is registered in `apps/web/src/config/artwork.ts` (`ARTWORK`, `LOGO`). Pages reference artwork by key only, so replacing art never touches layout code.

## Current artwork

| Key | File | Shown on | Size / format | Status | Motion |
| --- | --- | --- | --- | --- | --- |
| `homeHero` | Code: `apps/web/src/components/coming-soon/BounceStage.tsx` + geometry in `bounce.ts` | Saved for the coming-soon page (`ComingSoonHero`, preview `/{locale}/preview/coming-soon`); no longer on the home page | 720×420 SVG drawn in React | Temporary original | Plays once at 12 fps (24 drawings), replay button, frame slider. Reduced motion: no autoplay, final frame with all ghosts |
| `field2d` | `apps/web/public/artwork/field-2d.svg` | Home "Animation fields" strip | 400×300 SVG | Temporary original | Small hop on hover/focus; none under reduced motion |
| `field3d` | `apps/web/public/artwork/field-3d.svg` | Same | 400×300 SVG | Temporary original | Same |
| `fieldStopMotion` | `apps/web/public/artwork/field-stop-motion.svg` | Same | 400×300 SVG | Temporary original | Same |
| `fieldHybrid` | `apps/web/public/artwork/field-hybrid.svg` | Same | 400×300 SVG | Temporary original | Same |
| `LOGO.color` | `apps/web/public/brand/logo/logo-color.svg` | Header | Vector, ≈262×239 | **Supplied** (Society Drive) | None |
| `LOGO.white` | `apps/web/public/brand/logo/logo-white.svg` | Footer, member/admin sidebar | Vector | Supplied | None |
| `LOGO.colorOnDark`, `LOGO.black` | `apps/web/public/brand/logo/` | Not yet used | Vector | Supplied | None |

Also code-drawn and decorative (no manifest entry; edit in place):
- The membership-panel sweep and the initiative contour lines in `apps/web/src/app/[locale]/(public)/page.tsx`.
- The film-strip perforations in `home.module.css`.

## Replacing a field illustration

1. Export the new artwork, keeping its subject inside a 4:3 frame. SVG is preferred; for raster, use WebP or AVIF at least 800×600.
2. Overwrite the file in `apps/web/public/artwork/`, or add a new file and change `src` in `ARTWORK`.
3. Update `width`, `height`, the Arabic and English `alt`, `status` and `provenance` in `ARTWORK`.
4. Check the home page and `/fields` at 390 px and at desktop width in both `/ar` and `/en`. Every frame keeps the drawing's own shape (`object-fit: contain` or automatic height), so a drawing that isn't 4:3 is letterboxed, never cropped or stretched; check that the subject is still readable at about 300 px wide.

This procedure was tested on 11 November 2026 (ACCEPTANCE D-A05) with a 3:2 WebP in place of `field-2d.svg`. The test found and fixed a stretched stage on `/fields`.

The hover hop moves the whole image 8 px up. Artwork shouldn't touch the top edge.

## Replacing the hero

The hero is code, not an image, so its timing and squash can be inspected and edited.
- **Ball path:** edit `SEGMENTS` in `bounce.ts`. Each segment shares its end frame with the next one's start, and contact frames squash automatically. `npm test -w @as/web` checks that every frame stays in the stage, moves forward, squashes with constant volume and loses height on each bounce.
- **Film-strip shape:** edit `FILM_STRIP_PATH` and `FILM_STRIP_PERFORATIONS`.
- **Colours:** tokens in `apps/web/src/styles/tokens.css`. The gradient stops inside `BounceStage.tsx` mirror `--as-gradient-arc` and `--as-gradient-ball`.

To use a supplied animation instead (for example a render of the Society's After Effects logo animation, `Logo.aep`, in the Drive):
1. Export a short muted WebM/MP4 plus a poster frame.
2. Add an `ARTWORK.homeHero` entry pointing to it.
3. Render it with `<video muted playsinline>` that plays once, with the poster as the reduced-motion fallback.
4. Keep a visible replay control.

## Logo rules (Society guideline)

- Never narrower than 130 CSS px (`LOGO_MIN_WIDTH`; `BrandLogo` enforces it).
- Clear space 1.5× the ball diameter on every side.
- Don't recolour, apply a gradient, put it over photos or busy backgrounds, separate parts, or change spacing.

The SVGs were converted from `brand-source/drive/logo-versions.ai` (artboards 1, 3, 4, 6) with poppler `pdftocairo -svg`. They were then cropped to the drawn bounds, and the black artboard background was removed from the dark variants. To regenerate, repeat with the same artboards. Originals stay in `brand-source/` (not committed).

## Provenance

The field illustrations, hero and decorative shapes are original work by the developer (November 2026), created for this project and marked temporary. They use only the Society palette and the film-strip, ball and contour motifs from the guideline. They aren't Society productions and need the Society's review before launch. No image-generation tool was used. Character illustrations and participant artwork from the Drive aren't used anywhere because their rights are unconfirmed.

## Society Visual Elements and icons (added 4 November 2026)

Supplied brand artwork from the Drive ("Visual Sup"), registered in `ARTWORK` with status `supplied`:

| Key | File | Used on |
| --- | --- | --- |
| `characters` | `public/brand/elements/characters.webp` | Home hero crescent |
| `wavesWarm`, `wavesCool` | `waves-*.webp` | Closing band, video frame, menu sheet |
| `linesDark` | `lines-dark.webp` | Footer |
| `coverRibbons`, `ribbonWarm` | `ribbon-*.webp` | Initiative covers (labelled illustrative), Objectives, About and Fields heroes |
| `dotsWarm`, `dotsCool` | `dots-*.webp` | News and Partners heroes |
| `panelContours`, `panelSweeps`, `panelDiscs` | `panel-*.webp` | About intro, Membership and Contact heroes |

Brand line icons (guideline p.26) live in `public/brand/icons/*.webp` and are listed in `ICONS`. They're used for objectives and empty states.

To regenerate after the Society supplies new files, put them in `brand-source/` (not committed) and run:
```
node scripts/brand/derive-visual-elements.mjs
pdftocairo -png -transp -r 300 -singlefile brand-source/drive/icons.pdf brand-source/icons-hi
node scripts/brand/derive-icons.mjs
```
The scripts make two fixes. The character art's 28% white layer is made transparent while keeping its anti-aliased edges. The sheet pieces' outline frames are shaved off. After regenerating, update the `width`/`height` values in `ARTWORK` to match the script output, then check the hero crescent alignment (`--d` and `.crescent` offsets in `components/home/hero.module.css`).

Fonts: `apps/web/public/fonts/rns-sanz/RNSSanz-*.otf` (from the Drive; git-ignored until the web licence is confirmed, declared with `@font-face` in `styles/global.css`) and Cairo via Google Fonts at the guideline weights. Replace the OTFs in place to update them.

The four original field illustrations were recoloured on 4 November 2026 to logo black and brand greens and yellow, with no navy or blue.

## Night studio vectors and motion (added 5 November 2026)

`apps/web/src/components/art/Shapes.tsx` holds vector shapes redrawn from the Society's Visual Elements: `Planet` (the logo ball as a lit planet with green continents, from Visual Elements 3-1), `Blob` (three organic shapes, VE 3), `Arc` (sweeping band, VE 3), `Contours` (wobbly rings, VE 2-1 and 4-1) and `Balls` (dot clusters, VE 1 and 3). Guideline colours only; the navy ground of VE 3 is dropped. They're decorative (`aria-hidden`), status: temporary, developer-drawn from supplied art, needs the Society's review.

Each shape (and `Art`) takes `speed` (scroll parallax factor) and `depth` (pointer depth in px), read by `components/motion/MotionEngine.tsx`. To swap a shape for a supplied illustration, replace the component's SVG or render `Art` with the same `speed`/`depth`; layout code doesn't change. Don't centre these layers with the CSS `translate` property: the engine owns it.

Drive raster art on dark pages is feathered with a radial `mask-image` so rectangular crops don't show edges (`page.module.css .heroArt`, `home.module.css .heroRibbon`).

## Homepage section devices (added 8 November 2026)

All are code (CSS/SVG in `apps/web/src/app/[locale]/(public)/page.tsx`, `home.module.css`, `components/sections/Journey.tsx`, `MembershipDeck.tsx`, `sections.module.css`), decorative and `aria-hidden` unless noted, in guideline colours only. Status: temporary, developer-made, needs the Society's review.
- Countdown leader and projector beam (video section): replace by deleting the `.leader`/`.beam` markup once the real video is supplied; the screen frame can hold the `<video>` element.
- Animation paper with peg holes and onion skins (About).
- Zoetrope drum (Objectives).
- Light-table sheet stack (Fields) showing the existing `field*` drawings from the manifest.
- Bouncing-ball path with spacing ghosts (Journey).
- Membership cards (types): colours and ring pattern only; no logo (guideline minimum width 130px).
- Marquee poster frame (Projects) using the initiative's manifest cover.
- Assembly hemicycle (Governance): seat count is decorative and carries no data.

## Inner-page devices (added 9 November 2026)

All code (CSS/SVG), decorative and `aria-hidden`, guideline colours only. Status: temporary, developer-made, needs the Society's review.
- Camera field guide hero (`components/sections/PageHero.tsx`, `page.module.css`): the subject is an existing brand shape (`Planet`, `Blob`, `Balls`).
- Storyboard sketches (`components/art/Sketches.tsx`): bounce, horizon, table, chamber. Replace a sketch by editing its SVG function or pointing the About panel at an image.
- Field sets (`fields/fields.module.css`): paper, viewport, tabletop and split sets behind the existing `field*` drawings.
- Membership card fronts and backs, ticket stubs, project slates and viewfinder marks, exposure sheet, acetate cels, drawing disc and peg bar, policy binder, 404 film strip: all CSS in each page's module.

## Introduction films (added 8 November 2026)

Manifest: `VIDEOS.intro` in `apps/web/src/config/artwork.ts`. Files in `apps/web/public/video/`:

| File | Source | Notes |
| --- | --- | --- |
| `intro-ar.mp4` (18.7 MB) | Drive `PROMO_VID_FINAL_AR.mp4` (83 MB, Mar 2022) | 73 s, no audio track |
| `intro-en.mp4` (16.5 MB) | Drive `Promo Vid.mp4` (75 MB, Jul 2022) | 64 s, with audio |
| `intro-ar-poster.webp`, `intro-en-poster.webp` | Each film's logo end card | 1280×720 |

Web versions: H.264 High, 1280×720, about 2 Mbps, 24 fps, keyframe every 2 s, AAC 128 kbps, index at the front (fast start). They were made with a small AVFoundation script, because ffmpeg isn't installed; any encoder with those settings works. To replace a film: export at those settings, drop it at the same path (or point the manifest at a new file), update `seconds` and `hasAudio`, and refresh the poster.

Behaviour (`components/media/IntroFilm.tsx`): nothing loads until the visitor presses play (`preload="none"` with a poster); then native controls take over, and the film pauses when scrolled out of view. Status: supplied by the Society, not yet signed off. The films contain third-party animation clips (including *Captain Munch*), and the English film has no captions yet (ACCEPTANCE A25).

