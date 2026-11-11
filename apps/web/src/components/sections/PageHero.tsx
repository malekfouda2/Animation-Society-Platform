import type { ReactNode } from "react";
import { Balls, Blob, Planet } from "@/components/art/Shapes";
import styles from "./page.module.css";

interface Props {
  title: string;
  lead: string;
  /** Which brand light frames the camera field: green, yellow (mist) or warm red (cream). */
  tone?: "green" | "mist" | "cream";
  children?: ReactNode;
}

/*
 * The animator's camera field guide: twelve nested frames (1 to 12 field) around a centre cross.
 * One field is lit as the camera frame and holds a brand subject; as the page scrolls, the camera
 * trucks in (scale via MotionEngine --p). Decorative; carries no information.
 */
const W = 1600;
const H = 900;
const FIELDS = Array.from({ length: 12 }, (_, i) => i + 1);
const rect = (n: number) => {
  const w = (W * n) / 12;
  const h = (H * n) / 12;
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
};
const CAMERA = rect(6);
const BRACKET = 44;
const corners = [
  [CAMERA.x, CAMERA.y, 1, 1],
  [CAMERA.x + CAMERA.w, CAMERA.y, -1, 1],
  [CAMERA.x, CAMERA.y + CAMERA.h, 1, -1],
  [CAMERA.x + CAMERA.w, CAMERA.y + CAMERA.h, -1, -1],
] as const;

function FieldGuide() {
  return (
    <svg className={styles.guide} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <g className={styles.guideLines}>
        <line x1="0" y1="0" x2={W} y2={H} />
        <line x1={W} y1="0" x2="0" y2={H} />
        <line x1={W / 2} y1="0" x2={W / 2} y2={H} />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} />
        {FIELDS.map((n) => {
          const r = rect(n);
          return <rect key={n} x={r.x} y={r.y} width={r.w} height={r.h} />;
        })}
      </g>
      <g className={styles.guideNumbers}>
        {FIELDS.filter((n) => n > 1).map((n) => {
          const r = rect(n);
          return <text key={n} x={r.x + 10} y={r.y + 26}>{n}</text>;
        })}
      </g>
      <g className={styles.camera}>
        {corners.map(([x, y, dx, dy]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y + dy * BRACKET} V${y} H${x + dx * BRACKET}`} />
        ))}
        <circle cx={W / 2} cy={H / 2} r="10" />
      </g>
    </svg>
  );
}

/** Inner-page opening: a big title in front of the camera field guide, with a brand subject in frame. */
export function PageHero({ title, lead, tone = "mist", children }: Props) {
  return (
    <section className={`${styles.hero} ${styles[tone]}`} aria-labelledby="page-title" data-progress="leave">
      <div className={styles.heroLayers} aria-hidden="true">
        <div className={styles.truck}>
          <FieldGuide />
          <div className={styles.subject}>
            {tone === "cream" ? (
              <Planet className={styles.subjectShape} depth={18} />
            ) : tone === "green" ? (
              <Blob className={styles.subjectShape} variant={0} depth={18} />
            ) : (
              <Balls className={styles.subjectShape} depth={18} />
            )}
          </div>
        </div>
      </div>
      <div className={`container ${styles.heroCopy}`}>
        <h1 id="page-title" className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        {children}
      </div>
    </section>
  );
}
