import { useId, type CSSProperties } from "react";

/*
 * Vector shapes redrawn from the Society's Visual Elements 3 (planet, organic blobs, sweeping arc)
 * and Visual Elements 2/4 (contour lines), in the guideline palette only: the navy ground of the
 * originals is dropped (Malek, 3 Nov 2026). All decorative: aria-hidden, no meaning carried.
 * Provenance: docs/ARTWORK_REPLACEMENT.md, "Night studio vectors".
 */

interface ShapeProps {
  className?: string;
  style?: CSSProperties;
  /** Scroll parallax factor for components/motion/MotionEngine (e.g. 0.15). */
  speed?: number;
  /** Pointer depth in px for MotionEngine. */
  depth?: number;
}

const motionAttrs = (speed?: number, depth?: number) => ({
  ...(speed !== undefined ? { "data-speed": String(speed) } : {}),
  ...(depth !== undefined ? { "data-depth": String(depth) } : {}),
});

/** The logo's ball as a lit planet: yellow-to-red sphere with green continents (Visual Elements 3-1). */
export function Planet({ className, style, speed, depth, continents = true }: ShapeProps & { continents?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 400" className={className} style={style} aria-hidden="true" focusable="false" {...motionAttrs(speed, depth)}>
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="#ecd85d" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e44345" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ball`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecd85d" />
          <stop offset="100%" stopColor="#e44345" />
        </linearGradient>
        <radialGradient id={`${id}-shade`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="200" cy="200" r="120" />
        </clipPath>
      </defs>
      <circle cx="200" cy="200" r="200" fill={`url(#${id}-glow)`} />
      <circle cx="200" cy="200" r="120" fill={`url(#${id}-ball)`} />
      {continents ? (
        <g clipPath={`url(#${id}-clip)`} fill="#89c16d">
          <path d="M228 92c22 4 42 18 40 36s-26 20-30 38 18 26 6 40-38-2-52-14-20-34-8-52 22-52 44-48z" />
          <path d="M104 214c14-10 38-6 46 8s-4 30-20 34-30 12-36 2 0-34 10-44z" opacity="0.9" />
          <path d="M240 262c16-6 40 0 44 14s-14 22-30 24-28-4-28-16 2-18 14-22z" fill="#5eab64" />
        </g>
      ) : null}
      <circle cx="200" cy="200" r="120" fill={`url(#${id}-shade)`} />
    </svg>
  );
}

/** Organic brand blob (Visual Elements 3-1/3-2), filled with the green arc gradient. */
export function Blob({ className, style, speed, depth, variant = 0 }: ShapeProps & { variant?: 0 | 1 | 2 }) {
  const id = useId().replace(/:/g, "");
  const paths = [
    "M140 20c40-10 86 14 92 52s-26 50-20 84 34 56 6 80-76 2-100-24-36-46-70-60S-4 102 18 72 100 30 140 20z",
    "M60 30c30-24 84-18 104 10s-8 54 14 78 40 54 12 76-72 6-94-18-24-42-50-58S30 54 60 30z",
    "M120 14c44 0 70 30 64 62s-38 36-30 66 22 60-14 72-78-12-94-48 10-50-6-80S76 14 120 14z",
  ];
  return (
    <svg viewBox="0 0 250 260" className={className} style={style} aria-hidden="true" focusable="false" {...motionAttrs(speed, depth)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#89c16d" />
          <stop offset="100%" stopColor="#5eab64" />
        </linearGradient>
      </defs>
      <path d={paths[variant]} fill={`url(#${id}-g)`} />
    </svg>
  );
}

/** The sweeping arc band (Visual Elements 3-1/3-2) in the guideline's green-to-yellow gradient. */
export function Arc({ className, style, speed, depth, warm = false }: ShapeProps & { warm?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 600 600" className={className} style={style} aria-hidden="true" focusable="false" {...motionAttrs(speed, depth)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={warm ? "#e44345" : "#89c16d"} />
          <stop offset="100%" stopColor="#ecd85d" />
        </linearGradient>
      </defs>
      <path d="M40 600C40 300 260 70 560 40v120C340 190 170 380 170 600z" fill={`url(#${id}-g)`} />
    </svg>
  );
}

/** Wobbly concentric contours (Visual Elements 2-1 and 4-1), stroked in brand colours. */
export function Contours({ className, style, speed, depth, rings = 9, tone = "green" }: ShapeProps & { rings?: number; tone?: "green" | "warm" }) {
  const id = useId().replace(/:/g, "");
  const stroke = tone === "green" ? `url(#${id}-g)` : `url(#${id}-w)`;
  return (
    <svg viewBox="-300 -300 600 600" className={className} style={style} aria-hidden="true" focusable="false" {...motionAttrs(speed, depth)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#89c16d" />
          <stop offset="100%" stopColor="#ecd85d" />
        </linearGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e44345" />
          <stop offset="100%" stopColor="#ecd85d" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={stroke} strokeWidth="1.4">
        {Array.from({ length: rings }, (_, i) => {
          const r = 60 + i * (230 / rings);
          const k = 0.08 + i * 0.012;
          // A closed blob path: radius modulated by two low-frequency waves.
          const pts = Array.from({ length: 48 }, (__, j) => {
            const a = (j / 48) * Math.PI * 2;
            const rr = r * (1 + k * Math.sin(a * 3 + i * 0.6) + k * 0.6 * Math.cos(a * 2 - i));
            return `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr * 0.86).toFixed(1)}`;
          });
          return <polygon key={r} points={pts.join(" ")} strokeLinejoin="round" opacity={1 - i / (rings + 3)} />;
        })}
      </g>
    </svg>
  );
}

/** A loose cluster of small gradient balls (Visual Elements 1/3 dots). */
export function Balls({ className, style, speed, depth, warm = true }: ShapeProps & { warm?: boolean }) {
  const id = useId().replace(/:/g, "");
  const dots: [number, number, number][] = [
    [40, 60, 14], [150, 30, 6], [220, 120, 22], [90, 170, 8], [280, 40, 10], [300, 200, 5], [20, 240, 9],
  ];
  return (
    <svg viewBox="0 0 320 260" className={className} style={style} aria-hidden="true" focusable="false" {...motionAttrs(speed, depth)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecd85d" />
          <stop offset="100%" stopColor={warm ? "#e44345" : "#5eab64"} />
        </linearGradient>
      </defs>
      {dots.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={`url(#${id}-g)`} />
      ))}
    </svg>
  );
}
