import type { ContactMessageInput } from "@as/contracts";
import type { Mailer } from "../email/email.service.js";

export interface ContactStore {
  save(message: Omit<ContactMessageInput, "website">): Promise<{ id: string }>;
}

export type StoredContactMessage = Omit<ContactMessageInput, "website">;

/** Mailer port. Only a mock exists until the Society's email provider is chosen (DECISIONS D06). */
export interface ContactMailer {
  readonly mode: "mock" | "sandbox" | "live";
  notifySociety(id: string, message: StoredContactMessage): Promise<void>;
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

/**
 * Forwards each message to the Society's mailbox through the email outbox (the local inbox in
 * development). Until the Society names its mailbox (CONTACT_INBOX), messages are stored only.
 */
export function outboxContactMailer(mailer: Mailer, inbox: string | null, log: (msg: string, fields: object) => void): ContactMailer {
  return {
    mode: mailer.mode,
    async notifySociety(id, message) {
      if (!inbox) {
        log("contact message stored; no Society mailbox is configured (CONTACT_INBOX)", { contactId: id });
        return;
      }
      await mailer.send(inbox, "ar", {
        template: "contact_received",
        vars: { name: message.name, email: message.email, subject: message.subject, message: message.message, locale: message.locale },
      }, { dedupeKey: `contact:${id}` });
    },
  };
}
