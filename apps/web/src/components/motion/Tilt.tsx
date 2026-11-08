"use client";

import { useRef, type ReactNode } from "react";

/**
 * Pointer tilt for showcase cards: sets --rx/--ry (degrees) and --gx/--gy (glare position, %) on the
 * wrapper. CSS decides what moves. Mouse only; nothing happens under reduced motion or on touch.
 */
export function Tilt({ className, children, max = 8 }: { className?: string; children: ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
