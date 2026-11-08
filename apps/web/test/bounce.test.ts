import { describe, expect, it } from "vitest";
import { BALL_FRAMES, BALL_RADIUS, FRAME_COUNT, GROUND_Y, STAGE_WIDTH, ballFrame, mirrorX } from "../src/components/coming-soon/bounce";

describe("bounce timing", () => {
  it("has 24 drawings that stay inside the stage", () => {
    expect(BALL_FRAMES).toHaveLength(FRAME_COUNT);
    for (const f of BALL_FRAMES) {
      expect(f.x - BALL_RADIUS * f.scaleX).toBeGreaterThanOrEqual(0);
      expect(f.x + BALL_RADIUS * f.scaleX).toBeLessThanOrEqual(STAGE_WIDTH);
      expect(f.y + BALL_RADIUS * f.scaleY).toBeLessThanOrEqual(GROUND_Y + 0.001);
    }
  });

  it("moves forward on every frame", () => {
    BALL_FRAMES.slice(1).forEach((f, i) => {
      expect(f.x).toBeGreaterThan(BALL_FRAMES[i]?.x ?? Infinity);
    });
  });

  it("squashes on ground contacts and keeps volume", () => {
    const contacts = BALL_FRAMES.filter((f) => f.contact);
    expect(contacts.map((f) => f.index)).toEqual([6, 14, 19, 23]);
    for (const f of contacts) {
      expect(f.scaleY).toBeLessThan(1);
      expect(f.scaleX * f.scaleY).toBeCloseTo(1, 5);
      // Squashed ball sits on the ground line.
      expect(f.y + BALL_RADIUS * f.scaleY).toBeCloseTo(GROUND_Y, 5);
    }
  });

  it("loses height on each bounce", () => {
    const apex = (from: number, to: number) => Math.min(...BALL_FRAMES.slice(from, to + 1).map((f) => f.y));
    const a1 = apex(6, 14);
    const a2 = apex(14, 19);
    const a3 = apex(19, 23);
    expect(a1).toBeLessThan(a2);
    expect(a2).toBeLessThan(a3);
  });

  it("clamps out-of-range frames and mirrors for RTL", () => {
    expect(ballFrame(-5).index).toBe(0);
    expect(ballFrame(99).index).toBe(FRAME_COUNT - 1);
    expect(mirrorX(mirrorX(123))).toBe(123);
  });
});
