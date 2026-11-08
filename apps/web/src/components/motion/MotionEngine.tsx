"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One rAF loop for the public "night studio" world:
 * - Lenis inertial smooth scroll (wheel only; touch keeps native scrolling).
 * - [data-speed="0.2"]: scroll parallax. The layer moves by (distance from viewport centre × speed).
 * - [data-depth="12"]: pointer depth. The layer shifts up to N px towards/away from the pointer.
 * - [data-scroll-ball]: the page-progress ball, moved directly.
 * - [data-progress]: gets --p = how far the element has travelled through the viewport (0..1),
 *   used by pinned/scrubbed sections (zoetrope, countdown, word reveal, journey, chamber).
 * - main > section[data-offscreen]: set while a section is out of view so its CSS loops pause.
 * - [data-enter="rise|power|beam|sheet|zoetrope|slide|drop|deal|roll|pop"]: one-shot entrance. The
 *   element waits invisible until it scrolls into view, then gets data-entered and plays a CSS
 *   keyframe on transform/opacity (global.css). Driven by IntersectionObserver, never per frame.
 *
 * Performance rules (each frame must stay well under 16ms):
 * - No DOM reads in the loop. Positions are measured once (and on resize) and the loop works from
 *   the cached numbers plus window.scrollY.
 * - Only write when a value actually changed, and never write custom properties on <html> (that
 *   restyles the whole page). Layers far outside the viewport are skipped.
 * - The loop idles: after scroll and pointer have settled it stops until the next scroll/pointer event.
 * Uses the `translate` property so layers keep their own CSS transforms. Everything is skipped under
 * prefers-reduced-motion, leaving layers static and sections in their final state.
 */
export function MotionEngine() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      document.querySelectorAll<HTMLElement>("[data-progress]").forEach((el) => { el.style.setProperty("--p", "1"); });
      return;
    }

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, anchors: { offset: -96 }, autoRaf: false });

    interface Layer { el: HTMLElement; speed: number; depth: number; centre: number; last: string }
    interface Track { el: HTMLElement; mode: string; top: number; height: number; last: string }
    const layers: Layer[] = [...document.querySelectorAll<HTMLElement>("[data-speed], [data-depth]")].map((el) => ({
      el,
      speed: Number(el.dataset.speed) || 0,
      depth: Number(el.dataset.depth) || 0,
      centre: 0,
      last: "",
    }));
    const tracks: Track[] = [...document.querySelectorAll<HTMLElement>("[data-progress]")].map((el) => ({
      el,
      mode: el.dataset.progress ?? "",
      top: 0,
      height: 1,
      last: "",
    }));
    const ball = document.querySelector<HTMLElement>("[data-scroll-ball]");
    let ballLast = "";
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let vh = window.innerHeight;
    let maxScroll = 1;
    let frame = 0;
    let idleFrames = 0;
    let lastY = -1;

    // Measure document-space positions with the parallax offsets removed. Runs outside the loop.
    const measure = () => {
      vh = window.innerHeight;
      maxScroll = Math.max(1, root.scrollHeight - vh);
      const y = window.scrollY;
      for (const l of layers) l.el.style.translate = "";
      for (const l of layers) {
        const r = l.el.getBoundingClientRect();
        l.centre = r.top + y + r.height / 2;
        l.last = "";
      }
      for (const t of tracks) {
        const r = t.el.getBoundingClientRect();
        t.top = r.top + y;
        t.height = Math.max(1, t.el.offsetHeight);
        t.last = "";
      }
      ballLast = "";
      wake();
    };

    const tick = (time: number) => {
      lenis.raf(time);
      const y = window.scrollY;

      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      const pointerMoving = Math.abs(pointer.tx - pointer.x) > 0.0005 || Math.abs(pointer.ty - pointer.y) > 0.0005;
      const scrolling = y !== lastY || lenis.isScrolling !== false;
      lastY = y;

      if (ball) {
        const v = `0 ${((y / maxScroll) * 0.4 * vh).toFixed(1)}px`;
        if (v !== ballLast) { ball.style.translate = v; ballLast = v; }
      }

      const mid = y + vh / 2;
      for (const l of layers) {
        const dist = l.centre - mid;
        if (Math.abs(dist) > vh * 1.6) continue; // far off-screen: leave it until it comes back
        const v = `${(pointer.x * l.depth).toFixed(1)}px ${(dist * l.speed + pointer.y * l.depth).toFixed(1)}px`;
        if (v !== l.last) { l.el.style.translate = v; l.last = v; }
      }

      for (const t of tracks) {
        const top = t.top - y; // viewport-relative top, from cached layout
        let p: number;
        if (t.mode === "enter") p = (vh - top) / (vh * 0.65);
        else if (t.mode === "pin") p = -top / Math.max(1, t.height - vh);
        else p = (vh - top) / t.height;
        const v = Math.min(1, Math.max(0, p)).toFixed(3);
        if (v !== t.last) { t.el.style.setProperty("--p", v); t.last = v; }
      }

      idleFrames = scrolling || pointerMoving ? 0 : idleFrames + 1;
      frame = idleFrames > 30 ? 0 : requestAnimationFrame(tick); // sleep after ~0.5s of stillness
    };
    const wake = () => { idleFrames = 0; if (!frame) frame = requestAnimationFrame(tick); };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
      wake();
    };

    // Pause CSS loops (spinning rings, orbits, bouncing cues) in sections that are out of view.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) delete (e.target as HTMLElement).dataset.offscreen;
        else (e.target as HTMLElement).dataset.offscreen = "";
      }
    }, { rootMargin: "100px 0px" });
    document.querySelectorAll("main > section").forEach((s) => { io.observe(s); });

    // Entrances. Elements already on screen play now; ones the visitor has scrolled past are shown
    // without animation; the rest wait for the observer. Marked before data-motion turns on, so
    // nothing visible blinks out.
    const entering = [...document.querySelectorAll<HTMLElement>("[data-enter]:not([data-entered])")];
    const enterIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.entered = "";
        enterIo.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    for (const el of entering) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0) el.dataset.entered = "skip";
      else if (r.top < vh * 0.88) el.dataset.entered = "";
      else enterIo.observe(el);
    }

    measure();
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 120);
    });
    ro.observe(document.body);
    lenis.on("scroll", wake);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("wheel", wake, { passive: true }); // Lenis needs frames to turn wheel input into scroll
    window.addEventListener("pointermove", onPointer, { passive: true });
    const onReduce = () => { window.location.reload(); };
    reduce.addEventListener("change", onReduce);
    root.dataset.motion = "on";

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      enterIo.disconnect();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("pointermove", onPointer);
      reduce.removeEventListener("change", onReduce);
      lenis.destroy();
      for (const l of layers) l.el.style.translate = "";
      if (ball) ball.style.translate = "";
      delete root.dataset.motion;
    };
  }, [pathname]);

  return null;
}
