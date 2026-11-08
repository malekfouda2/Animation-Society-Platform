"use client";

import type { Locale } from "@as/contracts";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOGO } from "@/config/artwork";
import styles from "./motion.module.css";

export const INTRO_KEY = "as-intro-seen";

interface Props {
  otherLocale: Locale;
  otherHref: string;
  labels: { title: string; enter: string; enterOther: string };
}

const COLOURS = ["#5eab64", "#89c16d", "#ecd85d", "#e44345", "#ffffff"];

/**
 * Opening gate, once per browser session: the logo on black while streaks of brand-coloured light
 * fly out of it (a camera pushing through the studio), then a warp into the site. The layout's
 * inline script adds `intro` to <html> before paint only when the session hasn't seen it and motion
 * is allowed, so without JS or under reduced motion the gate never appears. Visitors choose their
 * language here; Escape or either button enters.
 */
export function IntroGate({ otherLocale, otherHref, labels }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "open" | "leaving" | "gone">("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const warpRef = useRef(1);

  useEffect(() => {
    // Read the class set by the inline script; a microtask keeps the state change out of the effect body.
    queueMicrotask(() => { setState(document.documentElement.classList.contains("intro") ? "open" : "gone"); });
  }, []);

  // Light streaks.
  useEffect(() => {
    if (state !== "open" && state !== "leaving") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    type Streak = { a: number; d: number; v: number; c: string; wd: number };
    const spawn = (): Streak => ({
      a: Math.random() * Math.PI * 2,
      d: 20 + Math.random() * 120,
      v: 0.6 + Math.random() * 2.2,
      c: COLOURS[Math.floor(Math.random() * COLOURS.length)] ?? "#ffffff",
      wd: 0.6 + Math.random() * 1.8,
    });
    const streaks = Array.from({ length: 70 }, () => {
      const s = spawn();
      s.d = Math.random() * Math.max(w, h) * 0.6;
      return s;
    });
    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const far = Math.hypot(cx, cy);
      for (const s of streaks) {
        s.v *= 1.012;
        s.d += s.v * warpRef.current;
        const len = Math.min(220, s.v * 9 * warpRef.current);
        if (s.d - len > far) Object.assign(s, spawn());
        const x1 = cx + Math.cos(s.a) * s.d;
        const y1 = cy + Math.sin(s.a) * s.d;
        const x0 = cx + Math.cos(s.a) * Math.max(0, s.d - len);
        const y0 = cy + Math.sin(s.a) * Math.max(0, s.d - len);
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, s.c);
        ctx.strokeStyle = g;
        ctx.globalAlpha = Math.min(1, s.d / 160);
        ctx.lineWidth = s.wd;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [state]);

  // Modal behaviour while open: the page behind is inert, focus starts on Enter, Escape enters.
  useEffect(() => {
    if (state !== "open") return;
    const root = rootRef.current;
    const others = [...(root?.parentElement?.children ?? [])].filter((el) => el !== root) as HTMLElement[];
    others.forEach((el) => { el.inert = true; });
    enterRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      others.forEach((el) => { el.inert = false; });
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- `leave` only reads refs and setters
  }, [state]);

  function remember() {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* storage blocked: the gate simply shows again next visit */
    }
  }

  function leave(then?: () => void) {
    remember();
    warpRef.current = 6;
    setState("leaving");
    window.setTimeout(() => {
      document.documentElement.classList.remove("intro");
      setState("gone");
      then?.();
    }, 700);
  }

  if (state === "gone") return null;

  return (
    <div
      ref={rootRef}
      className={styles.gate}
      data-state={state}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <canvas ref={canvasRef} className={styles.gateCanvas} aria-hidden="true" />
      <div className={styles.gateGlow} aria-hidden="true" />
      <div className={styles.gateCentre}>
        <Image src={LOGO.colorOnDark.src} width={200} height={Math.round((200 * LOGO.colorOnDark.height) / LOGO.colorOnDark.width)} alt="" priority unoptimized className={styles.gateLogo} />
        <span className={styles.gateBall} aria-hidden="true" />
        <p id="intro-title" className={styles.gateTitle}>{labels.title}</p>
        <div className={styles.gateActions}>
          <button ref={enterRef} type="button" className="btn btn-primary" onClick={() => { leave(); }}>
            {labels.enter}
          </button>
          <a
            href={otherHref}
            hrefLang={otherLocale}
            lang={otherLocale}
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              leave(() => { router.push(otherHref); });
            }}
          >
            {labels.enterOther}
          </a>
        </div>
      </div>
    </div>
  );
}
