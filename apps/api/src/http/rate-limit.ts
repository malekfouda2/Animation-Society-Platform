/**
 * Fixed-window in-memory limiter keyed by an arbitrary string (client address, email, session).
 * Single-process only: with more than one API process, move counters to MongoDB. Fine for the MVP.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let sweepAt = now() + windowMs;
  return (key: string): boolean => {
    const t = now();
    if (t >= sweepAt) {
      // Drop expired windows so the map cannot grow without bound.
      for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
      sweepAt = t + windowMs;
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}
export type RateLimiter = ReturnType<typeof createRateLimiter>;
