import type { Locale } from "@as/contracts";
import { JOURNEY } from "@/content/membership";
import styles from "./sections.module.css";

/*
 * The bouncing-ball exercise drawn as a path: the ball lands on each of the five stations and every
 * bounce is lower than the last, the way a real ball loses energy. Faint ghost balls mark where the
 * ball sits on each drawing (equal time steps, so they bunch at the top of each arc: the animator's
 * spacing chart). Box 1000×150, floor at y=120; mirrored for Arabic in CSS.
 */
const FLOOR = 120;
const STATIONS = [100, 300, 500, 700, 900];
const APEX = [8, 34, 58, 80]; // top of each bounce, lower each time
const ARCS = APEX.map((apex, i) => ({ x0: 100 + 200 * i, x1: 300 + 200 * i, cy: 2 * apex - FLOOR }));
const PATH = `M100 ${FLOOR} ${ARCS.map((a) => `Q${(a.x0 + a.x1) / 2} ${a.cy} ${a.x1} ${FLOOR}`).join(" ")}`;
const GHOSTS = ARCS.flatMap((a) =>
  [1, 2, 3, 4, 5, 6, 7].map((k) => {
    const t = k / 8;
    const x = a.x0 + (a.x1 - a.x0) * t;
    const y = (1 - t) * (1 - t) * FLOOR + 2 * (1 - t) * t * a.cy + t * t * FLOOR;
    return { x: Math.round(x), y: Math.round(y) };
  }),
);

/**
 * Membership journey: a real sequence, so steps are numbered. On wide screens the brand ball
 * bounces through the five stations as the block scrolls into view (MotionEngine --p); without JS
 * or under reduced motion it rests at the last station with the whole path drawn.
 */
export function Journey({ locale, headingLevel = "h4" }: { locale: Locale; headingLevel?: "h3" | "h4" }) {
  const Heading = headingLevel;
  const digits = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en");
  return (
    <div className={styles.journey} data-progress="enter">
      <svg className={styles.wave} viewBox="0 -14 1000 150" aria-hidden="true" focusable="false" data-enter="rise">
        <defs>
          <linearGradient id="journey-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#89c16d" />
            <stop offset="100%" stopColor="#ecd85d" />
          </linearGradient>
          <linearGradient id="journey-ball" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecd85d" />
            <stop offset="100%" stopColor="#e44345" />
          </linearGradient>
        </defs>
        <line x1="40" y1={FLOOR + 14} x2="960" y2={FLOOR + 14} className={styles.floor} />
        {GHOSTS.map((g) => (
          <circle key={`${g.x}-${g.y}`} cx={g.x} cy={g.y} r="5" className={styles.ghost} />
        ))}
        <path d={PATH} className={styles.waveBase} />
        <path d={PATH} className={styles.waveDrawn} pathLength={1} stroke="url(#journey-arc)" />
        {STATIONS.map((x) => (
          <ellipse key={x} cx={x} cy={FLOOR + 9} rx="17" ry="5" className={styles.station} />
        ))}
        <circle r="24" className={`${styles.waveBall} ${styles.waveGlow}`} style={{ offsetPath: `path("${PATH}")` }} />
        <circle r="13" className={styles.waveBall} fill="url(#journey-ball)" style={{ offsetPath: `path("${PATH}")` }} />
      </svg>
      <ol className={styles.steps}>
        {JOURNEY.map((step, i) => (
          <li key={step.key} className={styles.step} data-enter="rise" style={{ ["--enter-i" as string]: i }}>
            <span className={styles.stepNo} aria-hidden="true">{digits.format(i + 1)}</span>
            <Heading className={styles.stepTitle}>{step.title[locale]}</Heading>
            <p className={styles.stepBody}>{step.body[locale]}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
