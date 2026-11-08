"use client";

import { useRef, type ReactNode } from "react";
import styles from "./hero.module.css";

/**
 * Hero composition after the guideline cover: a white disc (the animator's lightbox) with the
 * Society's character crescent wrapped beneath it. Pointer movement gives a gentle depth shift on
 * hover-capable devices only; nothing moves under reduced motion.
 */
export function HeroScene({ disc, crescent }: { disc: ReactNode; crescent: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", x.toFixed(3));
    el.style.setProperty("--py", y.toFixed(3));
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--px", "0");
    ref.current?.style.setProperty("--py", "0");
  };

  return (
    <div ref={ref} className={styles.scene} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className={styles.disc}>{disc}</div>
      <div className={styles.crescent}>
        {crescent}
      </div>
    </div>
  );
}
