"use client";

import { useEffect, useRef } from "react";
import styles from "./motion.module.css";

/**
 * Animator's cursor: a ring that trails the pointer and squashes in the direction of travel like the
 * bouncing ball, growing over links and buttons. Mouse + motion-allowed only; the system cursor stays
 * visible, so this is decoration and never the only pointer cue.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const s = { x: -100, y: -100, tx: -100, ty: -100, scale: 1, ts: 1 };
    let frame = 0;
    let shown = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      s.tx = e.clientX;
      s.ty = e.clientY;
      if (!shown) {
        shown = true;
        s.x = s.tx;
        s.y = s.ty;
        el.dataset.visible = "true";
      }
      const t = e.target instanceof Element ? e.target.closest("a, button, [role='button'], input, textarea, select, label") : null;
      s.ts = t ? 2.2 : 1;
      const active = t ? "true" : "false";
      if (el.dataset.active !== active) el.dataset.active = active;
      wake();
    };
    const onLeave = () => { el.dataset.visible = "false"; shown = false; };
    const onDown = () => { s.ts *= 0.7; wake(); };

    const tick = () => {
      const dx = s.tx - s.x;
      const dy = s.ty - s.y;
      s.x += dx * 0.2;
      s.y += dy * 0.2;
      s.scale += (s.ts - s.scale) * 0.18;
      const speed = Math.min(0.45, Math.hypot(dx, dy) / 220);
      const angle = Math.atan2(dy, dx);
      el.style.transform =
        `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${angle.toFixed(3)}rad) ` +
        `scale(${(s.scale * (1 + speed)).toFixed(3)}, ${(s.scale * (1 - speed * 0.6)).toFixed(3)})`;
      // Sleep once the ring has caught up with the pointer; the next pointer event wakes it.
      const settled = Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3 && Math.abs(s.ts - s.scale) < 0.002;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className={styles.cursor} aria-hidden="true" data-visible="false" />;
}
