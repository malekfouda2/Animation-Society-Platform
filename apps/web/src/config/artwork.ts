import type { Locale } from "@as/contracts";

/**
 * Replaceable artwork manifest. Pages reference artwork by key only; to replace an image, swap the
 * file under public/ (or edit `src`) and update dimensions/alt here. See docs/ARTWORK_REPLACEMENT.md.
 */
export type ArtworkStatus = "temporary-original" | "supplied" | "approved";

export interface ArtworkEntry {
  /** Public path. Never a private Drive URL. */
  src: string;
  width: number;
  height: number;
  fit: "contain" | "cover";
  /** Localized alt text, or null when purely decorative. */
  alt: Readonly<Record<Locale, string>> | null;
  /** How the artwork moves and what replaces motion under prefers-reduced-motion. */
  motion: string;
  status: ArtworkStatus;
  provenance: string;
}

export const ARTWORK = {
  homeHero: {
    src: "code:components/coming-soon/BounceStage.tsx",
    width: 720,
    height: 420,
    fit: "contain",
    alt: {
      ar: "تمرين الكرة المرتدّة: الكرة تنطلق من شريط الفيلم وترتدّ ثلاث مرات، مع ظلال الإطارات السابقة واللاحقة.",
      en: "Bouncing-ball exercise: the ball leaves the film strip and bounces three times, with onion-skin ghosts of earlier and later frames.",
    },
    motion: "Plays the 24-drawing bounce once at 12 fps; user can replay or scrub. Reduced motion: no autoplay, final frame shown.",
    status: "temporary-original",
    provenance: "Code-drawn SVG by the developer, derived from the Society's film-strip and ball motifs (brand guideline pp.6, 25). Not a Society production.",
  },
  field2d: {
    src: "/artwork/field-2d.svg",
    width: 400,
    height: 300,
    fit: "contain",
    alt: { ar: "الكرة مرسومة بالقلم مع خطوط الإنشاء وقوس الحركة.", en: "The ball drawn in pencil with construction lines and a motion arc." },
    motion: "Small hop on hover/focus of its link; none under reduced motion.",
    status: "temporary-original",
    provenance: "Hand-authored SVG by the developer, 2026. Brand palette only.",
  },
  field3d: {
    src: "/artwork/field-3d.svg",
    width: 400,
    height: 300,
    fit: "contain",
    alt: { ar: "الكرة نموذجًا ثلاثي الأبعاد بشبكة سلكية فوق أرضية منظورية.", en: "The ball as a wireframed 3D model on a perspective floor." },
    motion: "Small hop on hover/focus of its link; none under reduced motion.",
    status: "temporary-original",
    provenance: "Hand-authored SVG by the developer, 2026. Brand palette only.",
  },
  fieldStopMotion: {
    src: "/artwork/field-stop-motion.svg",
    width: 400,
    height: 300,
    fit: "contain",
    alt: { ar: "الكرة من الصلصال على ذراع تثبيت فوق أرضية خشبية.", en: "The ball sculpted in clay, held by a rig arm over a wooden set floor." },
    motion: "Small hop on hover/focus of its link; none under reduced motion.",
    status: "temporary-original",
    provenance: "Hand-authored SVG by the developer, 2026. Brand palette only.",
  },
  fieldHybrid: {
    src: "/artwork/field-hybrid.svg",
    width: 400,
    height: 300,
    fit: "contain",
    alt: { ar: "كرة نصفها رسم يدوي ونصفها نموذج مجسّم.", en: "One ball, half hand-drawn line and half rendered model." },
    motion: "Small hop on hover/focus of its link; none under reduced motion.",
    status: "temporary-original",
    provenance: "Hand-authored SVG by the developer, 2026. Brand palette only.",
  },
  // Society Visual Elements (Drive: Visual Sup/Visual elements), web derivatives from
  // scripts/brand/derive-visual-elements.mjs. Decorative unless stated.
  characters: {
    src: "/brand/elements/characters.webp",
    width: 1600,
    height: 1294,
    fit: "contain",
    alt: {
      ar: "مشهد مرسوم لشخصيات رسوم متحركة داخل إطار هلالي، من العناصر البصرية للجمعية.",
      en: "An illustrated crowd of animated characters in a crescent frame, from the Society's visual elements.",
    },
    motion: "Rises into place on load; gentle pointer parallax on desktop. Static under reduced motion.",
    status: "supplied",
    provenance: "Society Drive: Visual elements/EXPORTED PNGs/visual element 5.png (guideline cover art).",
  },
  wavesWarm: {
    src: "/brand/elements/waves-warm.webp",
    width: 2400,
    height: 1350,
    fit: "cover",
    alt: null,
    motion: "Scroll-linked drift where supported; static otherwise.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 1-1.png",
  },
  wavesCool: {
    src: "/brand/elements/waves-cool.webp",
    width: 2400,
    height: 1348,
    fit: "cover",
    alt: null,
    motion: "Scroll-linked drift where supported; static otherwise.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 1-2.png",
  },
  linesDark: {
    src: "/brand/elements/lines-dark.webp",
    width: 2400,
    height: 1351,
    fit: "cover",
    alt: null,
    motion: "None.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 2-1.png",
  },
  coverRibbons: {
    src: "/brand/elements/ribbon-cool.webp",
    width: 1200,
    height: 716,
    fit: "cover",
    alt: null,
    motion: "Hover lift on its card.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 1-3.png (cool ribbon). Illustrative cover, not a project image.",
  },
  ribbonWarm: {
    src: "/brand/elements/ribbon-warm.webp",
    width: 1200,
    height: 714,
    fit: "contain",
    alt: null,
    motion: "Scroll-linked drift where supported.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 1-3.png (warm ribbon)",
  },
  dotsWarm: {
    src: "/brand/elements/dots-warm.webp",
    width: 1200,
    height: 711,
    fit: "contain",
    alt: null,
    motion: "Scroll-linked drift where supported.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 1-3.png (dots)",
  },
  dotsCool: {
    src: "/brand/elements/dots-cool.webp",
    width: 1200,
    height: 711,
    fit: "contain",
    alt: null,
    motion: "Scroll-linked drift where supported.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 1-3.png (dots)",
  },
  panelContours: {
    src: "/brand/elements/panel-contours.webp",
    width: 900,
    height: 1413,
    fit: "contain",
    alt: null,
    motion: "Scroll-linked drift where supported.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 4-1.png (contour panel)",
  },
  panelSweeps: {
    src: "/brand/elements/panel-sweeps.webp",
    width: 900,
    height: 1303,
    fit: "contain",
    alt: null,
    motion: "Scroll-linked drift where supported.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 4-1.png (sweeps panel)",
  },
  panelDiscs: {
    src: "/brand/elements/panel-discs.webp",
    width: 900,
    height: 1463,
    fit: "contain",
    alt: null,
    motion: "None.",
    status: "supplied",
    provenance: "Society Drive: Visual Elements 4-1.png (corner discs panel)",
  },
} as const satisfies Record<string, ArtworkEntry>;

export type ArtworkKey = keyof typeof ARTWORK;

/** Brand line icons cut from the guideline icon sheet (scripts/brand/derive-icons.mjs), 160x160 WebP. */
export const ICONS = [
  "growth", "skills", "creativity", "community", "partnerships", "clapper", "flag", "award",
  "ticket", "calendar", "document", "megaphone", "filmReel", "pen", "camera",
] as const;
export type IconName = (typeof ICONS)[number];
export const iconSrc = (name: IconName) => `/brand/icons/${name}.webp`;

/** Society logo files converted from the supplied vector master (brand-source/drive/logo-versions.ai). */
export const LOGO = {
  color: { src: "/brand/logo/logo-color.svg", width: 262, height: 239 },
  colorOnDark: { src: "/brand/logo/logo-color-on-dark.svg", width: 215, height: 186 },
  white: { src: "/brand/logo/logo-white.svg", width: 204, height: 186 },
  black: { src: "/brand/logo/logo-black.svg", width: 263, height: 239 },
} as const;

/** Brand guideline p.13: never render the logo narrower than 130 CSS px. */
export const LOGO_MIN_WIDTH = 130;
