import type { ContactMessageInput } from "@as/contracts";

export interface ContactStore {
  save(message: Omit<ContactMessageInput, "website">): Promise<{ id: string }>;
}

/** Mailer port. Only a mock exists until the Society's email provider is chosen (DECISIONS D06). */
export interface ContactMailer {
  readonly mode: "mock" | "sandbox" | "live";
  notifySociety(id: string): Promise<void>;
}

export function mongoContactStore(model: { create(doc: object): Promise<{ id: unknown }> }): ContactStore {
  return {
    async save(message) {
      const doc = await model.create(message);
      return { id: String(doc.id) };
    },
  };
}

/** Development-only: records that a message would be forwarded; sends nothing. */
export function mockMailer(log: (msg: string, fields: object) => void): ContactMailer {
  return {
    mode: "mock",
    notifySociety(id) {
      log("contact message stored; email delivery is mocked in this environment", { contactId: id });
      return Promise.resolve();
    },
  };
}

/** Fixed-window in-memory limiter keyed by client address. Single-process only; fine for the MVP. */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string): boolean => {
    const t = now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}
