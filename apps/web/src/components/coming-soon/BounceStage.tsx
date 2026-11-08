"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BALL_FRAMES,
  BALL_RADIUS,
  FILM_STRIP_PATH,
  FILM_STRIP_PERFORATIONS,
  FRAME_COUNT,
  FRAMES_PER_SECOND,
  GROUND_Y,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  mirrorX,
} from "./bounce";
import styles from "./BounceStage.module.css";

interface Labels {
  label: string;
  caption: string;
  play: string;
  replay: string;
  frame: string;
  frameValue: string;
  spacing: string;
}

interface Props {
  dir: "rtl" | "ltr";
  labels: Labels;
  description: string;
  /** Optional class for the drawing's frame (the hero shapes it into the white disc). */
  screenClassName?: string;
  /** Optional class added to the controls row. */
  controlsClassName?: string;
}

const LAST = FRAME_COUNT - 1;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hero artwork: the bouncing-ball exercise drawn as an animator's onion-skin view.
 * Past frames are tinted red and future frames green, like onion skinning in animation software,
 * and those happen to be the brand colours. Server render shows the final pose with every ghost
 * visible; it plays once on load unless the visitor prefers reduced motion.
 */
export function BounceStage({ dir, labels, description, screenClassName, controlsClassName }: Props) {
  const [frame, setFrame] = useState(LAST);
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef(LAST);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const sliderId = `${baseId}-frame`;
  const rtl = dir === "rtl";
  const X = (x: number) => (rtl ? mirrorX(x) : x);

  const show = (next: number) => {
    frameRef.current = next;
    setFrame(next);
  };

  const play = () => {
    show(0);
    setPlaying(true);
  };

  // Autoplay once after hydration, outside the effect body, unless reduced motion is preferred.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raf = requestAnimationFrame(() => {
      frameRef.current = 0;
      setFrame(0);
      setPlaying(true);
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const next = frameRef.current + 1;
      if (next > LAST) {
        setPlaying(false);
        return;
      }
      show(next);
    }, 1000 / FRAMES_PER_SECOND);
    return () => {
      window.clearInterval(timer);
    };
  }, [playing]);

  const current = BALL_FRAMES[frame] ?? BALL_FRAMES[LAST];
  if (!current) return null;
  const heightAboveGround = GROUND_Y - (current.y + BALL_RADIUS * current.scaleY);
  const shadowScale = Math.max(0.35, 1 - heightAboveGround / 260);
  const xs = BALL_FRAMES.map((f) => X(f.x));
  const chartStart = Math.min(...xs) - 10;
  const chartEnd = Math.max(...xs) + 10;
  const valueText = labels.frameValue.replace("{n}", String(frame + 1)).replace("{total}", String(FRAME_COUNT));

  return (
    <figure className={styles.figure}>
      <div className={screenClassName ?? styles.screen}>
      <svg
        className={styles.stage}
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>{description}</title>
        <defs>
          <linearGradient id={`${baseId}-arc`} gradientUnits="userSpaceOnUse" x1="30" y1="0" x2="478" y2="0">
            <stop offset="0" stopColor="#89c16d" />
            <stop offset="1" stopColor="#ecd85d" />
          </linearGradient>
          <linearGradient id={`${baseId}-ball`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ecd85d" />
            <stop offset="1" stopColor="#e44345" />
          </linearGradient>
        </defs>

        {/* ground */}
        <line x1="12" y1={GROUND_Y} x2={STAGE_WIDTH - 12} y2={GROUND_Y} className={styles.ground} />

        {/* film strip (brand guideline pattern p.25), mirrored for RTL so motion follows reading direction */}
        <g transform={rtl ? `matrix(-1 0 0 1 ${STAGE_WIDTH} 0)` : undefined}>
          <path d={FILM_STRIP_PATH} fill={`url(#${baseId}-arc)`} />
          {FILM_STRIP_PERFORATIONS.map((d) => (
            <path key={d} d={d} className={styles.perforation} />
          ))}
        </g>

        {/* onion skin: every drawing, tinted by past/future */}
        {BALL_FRAMES.map((f) =>
          f.index === frame ? null : (
            <ellipse
              key={f.index}
              cx={X(f.x)}
              cy={f.y}
              rx={BALL_RADIUS * f.scaleX}
              ry={BALL_RADIUS * f.scaleY}
              className={f.index < frame ? styles.ghostPast : styles.ghostFuture}
            />
          ),
        )}

        {/* contact shadow and the current drawing */}
        <ellipse
          cx={X(current.x)}
          cy={GROUND_Y + 3}
          rx={BALL_RADIUS * 1.3 * shadowScale}
          ry={4 * shadowScale}
          className={styles.shadow}
        />
        <ellipse
          cx={X(current.x)}
          cy={current.y}
          rx={BALL_RADIUS * current.scaleX}
          ry={BALL_RADIUS * current.scaleY}
          fill={`url(#${baseId}-ball)`}
          className={styles.ball}
        />

        {/* animator's timing chart: one tick per drawing, positioned by spacing */}
        <g aria-hidden="true">
          <line x1={chartStart} y1="384" x2={chartEnd} y2="384" className={styles.chartLine} />
          {BALL_FRAMES.map((f) => (
            <line
              key={f.index}
              x1={X(f.x)}
              x2={X(f.x)}
              y1={f.index === frame ? 370 : 377}
              y2="391"
              className={f.index === frame ? styles.tickCurrent : f.contact ? styles.tickContact : styles.tick}
            />
          ))}
          <text
            x={rtl ? chartEnd : chartStart}
            y="412"
            direction={dir}
            textAnchor="start"
            className={styles.chartLabel}
          >
            {labels.spacing}
          </text>
        </g>
      </svg>
      </div>

      <div className={controlsClassName ?? styles.panel}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.play}
          onClick={play}
          disabled={playing}
        >
          <span aria-hidden="true" className={styles.playIcon} />
          {frame === LAST ? labels.replay : labels.play}
        </button>
        <label htmlFor={sliderId} className={styles.sliderLabel}>
          {labels.frame}
        </label>
        <input
          id={sliderId}
          type="range"
          min={1}
          max={FRAME_COUNT}
          step={1}
          value={frame + 1}
          aria-valuetext={valueText}
          className={styles.slider}
          onChange={(e) => {
            setPlaying(false);
            show(Number(e.currentTarget.value) - 1);
          }}
        />
        <output htmlFor={sliderId} className={styles.counter} dir="ltr">
          {pad(frame + 1)}/{FRAME_COUNT}
        </output>
      </div>
      <p className={styles.caption}>
        <strong>{labels.label}.</strong> {labels.caption}
      </p>
      </div>
    </figure>
  );
}
