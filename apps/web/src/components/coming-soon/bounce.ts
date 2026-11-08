/**
 * Bouncing-ball exercise used by the homepage hero. The Society's logo is a film-strip arc that
 * launches a ball; the hero continues that motion as the classic animation exercise.
 * Pure geometry (no DOM) so it is unit-tested and shared by the stage and its timing chart.
 * Coordinates are in a 720 x 420 SVG user space, drawn left-to-right; RTL mirrors with mirrorX().
 */
export const STAGE_WIDTH = 720;
export const STAGE_HEIGHT = 420;
export const GROUND_Y = 330;
export const BALL_RADIUS = 18;
export const FRAME_COUNT = 24;
/** Animated "on twos": 24 drawings shown at 12 frames per second. */
export const FRAMES_PER_SECOND = 12;

export interface BallFrame {
  index: number;
  x: number;
  y: number;
  /** Horizontal and vertical scale for squash and stretch. */
  scaleX: number;
  scaleY: number;
  contact: boolean;
}

interface Segment {
  from: number;
  to: number;
  startX: number;
  endX: number;
  kind: "fall" | "bounce";
  startY?: number;
  height?: number;
}

const RELEASE = { x: 478, y: 168 };

// Frame ranges share their boundary frames (a contact frame ends one segment and starts the next).
const SEGMENTS: readonly Segment[] = [
  { from: 0, to: 6, startX: RELEASE.x, endX: 540, kind: "fall", startY: RELEASE.y },
  { from: 6, to: 14, startX: 540, endX: 615, kind: "bounce", height: 120 },
  { from: 14, to: 19, startX: 615, endX: 660, kind: "bounce", height: 55 },
  { from: 19, to: 23, startX: 660, endX: 688, kind: "bounce", height: 20 },
];

const CONTACT_FRAMES = new Set(SEGMENTS.map((s) => s.to));
const restY = GROUND_Y - BALL_RADIUS;

export function ballFrame(index: number): BallFrame {
  const i = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
  const segment = SEGMENTS.find((s) => i >= s.from && i <= s.to) ?? SEGMENTS[SEGMENTS.length - 1];
  if (!segment) throw new Error("bounce segments missing");
  const span = segment.to - segment.from;
  const u = span === 0 ? 1 : (i - segment.from) / span;
  const x = segment.startX + (segment.endX - segment.startX) * u;
  let y: number;
  if (segment.kind === "fall") {
    // Accelerating fall: spacing widens toward the ground.
    const startY = segment.startY ?? restY;
    y = startY + (restY - startY) * u * u;
  } else {
    // Parabolic hop: spacing tightens near the apex (slow in, slow out).
    y = restY - 4 * (segment.height ?? 0) * u * (1 - u);
  }
  const contact = CONTACT_FRAMES.has(i);
  const previous = i > 0 ? ballFrameY(i - 1) : y;
  const speed = Math.abs(y - previous);
  let scaleX = 1;
  let scaleY = 1;
  if (contact) {
    // Squash on contact, preserving volume.
    scaleY = 0.72;
    scaleX = 1 / scaleY;
  } else if (speed > 18) {
    // Stretch along fast vertical motion.
    scaleY = 1.18;
    scaleX = 1 / scaleY;
  }
  return { index: i, x, y: contact ? restY + BALL_RADIUS * (1 - scaleY) : y, scaleX, scaleY, contact };
}

function ballFrameY(index: number): number {
  const segment = SEGMENTS.find((s) => index >= s.from && index <= s.to);
  if (!segment) return restY;
  const span = segment.to - segment.from;
  const u = span === 0 ? 1 : (index - segment.from) / span;
  if (segment.kind === "fall") {
    const startY = segment.startY ?? restY;
    return startY + (restY - startY) * u * u;
  }
  return restY - 4 * (segment.height ?? 0) * u * (1 - u);
}

export const BALL_FRAMES: readonly BallFrame[] = Array.from({ length: FRAME_COUNT }, (_, i) => ballFrame(i));

export function mirrorX(x: number): number {
  return STAGE_WIDTH - x;
}

/** Tapering film-strip band (thick base, pointed tip at the release point). */
export const FILM_STRIP_PATH = `M 30 ${GROUND_Y} Q 230 -40 ${RELEASE.x - 8} ${RELEASE.y - 3} Q 270 40 112 ${GROUND_Y} Z`;
/** Perforation lines just inside each edge of the band. */
export const FILM_STRIP_PERFORATIONS = [
  `M 46 ${GROUND_Y - 2} Q 236 -16 ${RELEASE.x - 16} ${RELEASE.y - 5}`,
  `M 98 ${GROUND_Y - 2} Q 266 62 ${RELEASE.x - 16} ${RELEASE.y - 5}`,
] as const;
