"use client";

import { FULL_CROP, type Crop } from "@as/contracts";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ContentAdminDict } from "@/i18n/types";
import styles from "./media.module.css";

type Shape = "free" | "square" | "landscape" | "wide" | "portrait";
/** Pixel aspect (width / height) of each shape; null is free. */
const RATIO: Record<Shape, number | null> = { free: null, square: 1, landscape: 4 / 3, wide: 16 / 9, portrait: 3 / 4 };
const MIN = 0.05;
type Handle = "move" | "nw" | "ne" | "sw" | "se";

const round = (n: number) => Math.round(n * 10_000) / 10_000;

/** Keeps the frame inside the picture and above the minimum size. */
function clamp(c: Crop): Crop {
  const w = Math.min(1, Math.max(MIN, c.w));
  const h = Math.min(1, Math.max(MIN, c.h));
  return { x: round(Math.min(1 - w, Math.max(0, c.x))), y: round(Math.min(1 - h, Math.max(0, c.y))), w: round(w), h: round(h) };
}

/** The largest frame of a pixel aspect ratio, centred on the picture. */
function fitRatio(ratio: number, W: number, H: number): Crop {
  // In fractions, w / h = ratio * H / W.
  const k = (ratio * H) / W;
  const w = k >= 1 ? 1 : k;
  const h = k >= 1 ? 1 / k : 1;
  return clamp({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
}

/**
 * Crop tool in a modal dialog (native <dialog>: focus stays inside, Escape cancels). The frame can be
 * dragged, resized from its corners, or moved and resized with the keyboard. Positions are in the
 * picture's own coordinates, so the stage is always laid out left to right.
 */
export function CropDialog({ src, width, height, initial, dict, onApply, onClose }: {
  src: string;
  width: number;
  height: number;
  initial: Crop;
  dict: ContentAdminDict;
  onApply: (crop: Crop) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: Handle; start: Crop; px: number; py: number } | null>(null);
  const [crop, setCrop] = useState<Crop>(initial);
  const [shape, setShape] = useState<Shape>("free");
  const ratio = RATIO[shape];
  const c = dict.crop;

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    return () => { d?.close(); };
  }, []);

  /** Fraction-space aspect for the current shape (w / h). */
  const k = ratio === null ? null : (ratio * height) / width;

  function resize(start: Crop, handle: Exclude<Handle, "move">, dx: number, dy: number): Crop {
    const left = handle === "nw" || handle === "sw";
    const top = handle === "nw" || handle === "ne";
    // The opposite corner stays put.
    const ax = left ? start.x + start.w : start.x;
    const ay = top ? start.y + start.h : start.y;
    let w = Math.max(MIN, left ? start.w - dx : start.w + dx);
    let h = Math.max(MIN, top ? start.h - dy : start.h + dy);
    if (k !== null) {
      if (w / h > k) w = h * k;
      else h = w / k;
    }
    // Stay inside the picture on the moving sides.
    const maxW = left ? ax : 1 - ax;
    const maxH = top ? ay : 1 - ay;
    if (w > maxW) { w = maxW; if (k !== null) h = w / k; }
    if (h > maxH) { h = maxH; if (k !== null) w = h * k; }
    return clamp({ x: left ? ax - w : ax, y: top ? ay - h : ay, w, h });
  }

  function startDrag(handle: Handle, e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    stageRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = { handle, start: crop, px: e.clientX, py: e.clientY };
  }

  function onPointerMove(e: PointerEvent) {
    const d = dragRef.current;
    const box = stageRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = (e.clientX - d.px) / box.width;
    const dy = (e.clientY - d.py) / box.height;
    setCrop(d.handle === "move" ? clamp({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }) : resize(d.start, d.handle, dx, dy));
  }

  function onKeyDown(e: KeyboardEvent) {
    const step = e.altKey ? 0.002 : 0.01;
    const keys: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = keys[e.key];
    if (!move) return;
    e.preventDefault();
    const [dx, dy] = move;
    setCrop((cur) => (e.shiftKey ? resize(cur, "se", dx || (k !== null ? dy * k : 0), dy || (k !== null ? dx / k : 0)) : clamp({ ...cur, x: cur.x + dx, y: cur.y + dy })));
  }

  function chooseShape(next: Shape) {
    setShape(next);
    const r = RATIO[next];
    if (r !== null) setCrop(fitRatio(r, width, height));
  }

  const pct = (n: number) => `${n * 100}%`;
  const px = (n: number, of: number) => Math.round(n * of);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="crop-title" aria-describedby="crop-lead" onClose={onClose}>
      <div className={styles.dialogHead}>
        <h2 id="crop-title">{c.title}</h2>
        <p id="crop-lead">{c.lead}</p>
      </div>
      <div className={styles.cropTools}>
        <label className={styles.shapeField}>
          <span>{c.shape}</span>
          <select value={shape} onChange={(e) => { chooseShape(e.currentTarget.value as Shape); }}>
            {(Object.keys(RATIO) as Shape[]).map((s) => <option key={s} value={s}>{c.shapes[s]}</option>)}
          </select>
        </label>
        <p className={styles.cropSize} aria-live="polite">{px(crop.w, width)} × {px(crop.h, height)} px</p>
      </div>
      <div className={styles.stageWrap} dir="ltr">
        <div
          ref={stageRef}
          className={styles.stage}
          style={{ aspectRatio: `${width} / ${height}`, inlineSize: `min(100%, calc(60dvh * ${width / height}))` }}
          onPointerMove={onPointerMove}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- staff preview served by the API */}
          <img src={src} alt="" className={styles.stageImg} draggable={false} />
          {/* Dimming outside the frame, clipped to the picture; the frame and its handles sit above it unclipped. */}
          <span className={styles.shade} aria-hidden="true">
            <span className={styles.hole} style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h) }} />
          </span>
          {/* The frame is a button so it can take focus and arrow keys; dragging works on it and its corners. */}
          <button
            type="button"
            className={styles.frame}
            style={{ left: pct(crop.x), top: pct(crop.y), width: pct(crop.w), height: pct(crop.h) }}
            aria-label={`${c.area}: ${px(crop.w, width)} × ${px(crop.h, height)} px`}
            aria-describedby="crop-keys"
            onPointerDown={(e) => { startDrag("move", e); }}
            onKeyDown={onKeyDown}
          >
            {(["nw", "ne", "sw", "se"] as const).map((h) => (
              <span key={h} className={styles.handle} data-h={h} onPointerDown={(e) => { startDrag(h, e); }} aria-hidden="true" />
            ))}
          </button>
        </div>
      </div>
      <p id="crop-keys" className={styles.cropKeys}>{c.keys}</p>
      <div className={styles.dialogActions}>
        <button type="button" className="btn btn-primary" onClick={() => { onApply(crop); }}>{c.apply}</button>
        <button type="button" className="btn btn-secondary" onClick={() => { onApply(FULL_CROP); }}>{c.reset}</button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>{c.cancel}</button>
      </div>
    </dialog>
  );
}
