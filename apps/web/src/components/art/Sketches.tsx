/*
 * Rough storyboard sketches (About page). Pencil-weight strokes with one brand colour each, drawn in
 * a 320×180 panel. Original SVG by the developer; decorative only (aria-hidden), no meaning carried.
 * Provenance: docs/ARTWORK_REPLACEMENT.md, "Inner pages".
 */
import { useId, type JSX } from "react";

type SketchName = "bounce" | "horizon" | "table" | "chamber";

const pencil = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Bounce({ ball }: { ball: string }) {
  return (
    <>
      <line x1="16" y1="150" x2="304" y2="150" {...pencil} opacity="0.55" />
      <path d="M30 40 Q74 40 92 146 Q118 70 150 146 Q170 104 192 146" {...pencil} strokeDasharray="2 7" opacity="0.7" />
      {[[30, 40, 0.18], [66, 70, 0.28], [92, 138, 0.4], [124, 96, 0.55], [150, 138, 0.7]].map(([x, y, o]) => (
        <circle key={x} cx={x} cy={y} r="11" {...pencil} opacity={o} />
      ))}
      <ellipse cx="192" cy="140" rx="15" ry="9" fill={ball} />
      <path d="M214 120 l18 -4 M216 132 l22 0 M214 144 l18 4" {...pencil} opacity="0.6" />
      <path d="M248 46 h44 M282 36 l10 10 -10 10" {...pencil} opacity="0.5" />
    </>
  );
}

function Horizon({ ball }: { ball: string }) {
  return (
    <>
      <path d="M0 120 C60 112 110 126 160 118 S260 110 320 120" {...pencil} opacity="0.6" />
      <path d="M0 140 C80 134 140 146 200 138 S280 134 320 140" {...pencil} opacity="0.3" />
      <path d="M120 118 A40 40 0 0 1 200 118 Z" fill={ball} />
      <path d="M160 64 V24 M150 34 l10 -10 10 10" {...pencil} opacity="0.65" />
      {[-60, -35, 35, 60].map((a) => (
        <line
          key={a}
          x1={160 + Math.sin((a * Math.PI) / 180) * 52}
          y1={118 - Math.cos((a * Math.PI) / 180) * 52}
          x2={160 + Math.sin((a * Math.PI) / 180) * 70}
          y2={118 - Math.cos((a * Math.PI) / 180) * 70}
          {...pencil}
          opacity="0.5"
        />
      ))}
    </>
  );
}

function Table({ ball }: { ball: string }) {
  return (
    <>
      <path d="M40 112 H280 M56 112 l-10 44 M264 112 l10 44" {...pencil} opacity="0.7" />
      {[70, 115, 160, 205, 250].map((x) => (
        <path key={x} d={`M${x - 16} 104 V62 q0 -10 10 -10 h12 q10 0 10 10 V104`} {...pencil} strokeDasharray="5 6" opacity="0.55" />
      ))}
      <circle cx="160" cy="98" r="8" fill={ball} />
    </>
  );
}

function Chamber({ ball }: { ball: string }) {
  const rows = [52, 76, 100];
  return (
    <>
      {rows.map((r, row) =>
        Array.from({ length: 7 + row * 3 }, (_, n) => {
          const count = 7 + row * 3;
          const a = Math.PI - (n / (count - 1)) * Math.PI;
          const cx = +(160 + r * 1.3 * Math.cos(a)).toFixed(1);
          const cy = +(156 - r * Math.sin(a)).toFixed(1);
          return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" {...pencil} strokeWidth={1.6} opacity={0.35 + row * 0.15} />;
        }),
      )}
      <circle cx="160" cy="150" r="9" fill={ball} />
      <line x1="20" y1="162" x2="300" y2="162" {...pencil} opacity="0.45" />
    </>
  );
}

const SKETCHES: Record<SketchName, (p: { ball: string }) => JSX.Element> = { bounce: Bounce, horizon: Horizon, table: Table, chamber: Chamber };

export function Sketch({ name, className }: { name: SketchName; className?: string }) {
  const Drawing = SKETCHES[name];
  const id = `sk${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecd85d" />
          <stop offset="100%" stopColor="#e44345" />
        </linearGradient>
      </defs>
      <Drawing ball={`url(#${id})`} />
    </svg>
  );
}
