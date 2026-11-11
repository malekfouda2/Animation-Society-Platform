import type { Locale } from "@as/contracts";
import type { ClientSession } from "mongoose";
import { Email } from "./email.model.js";
import { renderEmail, type EmailTemplate } from "./email.templates.js";

export type EmailMode = "mock" | "sandbox" | "live";

/** Provider port. Only the mock exists until the Society chooses an email provider (DECISIONS D06). */
export interface EmailTransport {
  readonly mode: EmailMode;
  deliver(message: { to: string; subject: string; text: string }): Promise<void>;
}

/** Development only: the outbox record is the delivered message; nothing leaves the machine. */
export const localInboxTransport: EmailTransport = { mode: "mock", deliver: () => Promise.resolve() };

export interface Mailer {
  readonly mode: EmailMode;
  /**
   * Persists the email (inside the caller's transaction when given) and returns its ID.
   * Call deliver() after the transaction commits.
   */
  queue(to: string, locale: Locale, t: EmailTemplate, opts?: { dedupeKey?: string; session?: ClientSession }): Promise<string>;
  deliver(id: string): Promise<void>;
  send(to: string, locale: Locale, t: EmailTemplate, opts?: { dedupeKey?: string }): Promise<void>;
}

export function createMailer(transport: EmailTransport, now: () => Date = () => new Date()): Mailer {
  const mailer: Mailer = {
    mode: transport.mode,
    async queue(to, locale, t, opts = {}) {
      const { subject, text } = renderEmail(locale, t);
      const doc = { to, locale, template: t.template, subject, text, mode: transport.mode, ...(opts.dedupeKey ? { dedupeKey: opts.dedupeKey } : {}) };
      const [created] = await Email.create([doc], opts.session ? { session: opts.session } : {});
      if (!created) throw new Error("email not queued");
      return String(created._id);
    },
    async deliver(id) {
      const email = await Email.findOneAndUpdate({ _id: id, status: "pending" }, { $inc: { attempts: 1 } }, { returnDocument: "after" });
      if (!email?.text) return;
      try {
        await transport.deliver({ to: email.to, subject: email.subject, text: email.text });
        // A real provider gets the body; the stored copy is dropped because it can hold sign-in links.
        const clear = transport.mode === "mock" ? {} : { text: null };
        await Email.updateOne({ _id: id }, { status: "delivered", deliveredAt: now(), lastError: null, ...clear });
      } catch (err) {
        // Left pending for the worker's retry (Stage 5 jobs); recorded without provider payloads.
        await Email.updateOne({ _id: id }, { lastError: err instanceof Error ? err.message.slice(0, 300) : "delivery failed" });
      }
    },
    async send(to, locale, t, opts) {
      await mailer.deliver(await mailer.queue(to, locale, t, opts));
    },
  };
  return mailer;
}
