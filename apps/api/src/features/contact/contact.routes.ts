import { contactMessageSchema, type ContactMessageInput } from "@as/contracts";
import { Router } from "express";
import { HttpError } from "../../http/errors.js";
import { createRateLimiter, type ContactMailer, type ContactStore } from "./contact.service.js";

export interface ContactDeps {
  store: ContactStore;
  mailer: ContactMailer;
  /** Browser requests must come from the site itself (CSRF defence for this cookie-less form). */
  publicOrigin: string;
  rateLimit?: { limit: number; windowMs: number };
}

export function contactRouter({ store, mailer, publicOrigin, rateLimit = { limit: 5, windowMs: 10 * 60_000 } }: ContactDeps): Router {
  const router = Router();
  const allow = createRateLimiter(rateLimit.limit, rateLimit.windowMs);

  router.post("/contact", async (req, res) => {
    if (req.get("origin") !== publicOrigin) {
      throw new HttpError("forbidden", "Cross-origin submission refused");
    }
    if (!allow(req.ip ?? "unknown")) {
      throw new HttpError("rate_limited", "Too many messages; try again later");
    }
    const input: ContactMessageInput = contactMessageSchema.parse(req.body);
    // Honeypot filled: answer like success so bots learn nothing, but store nothing.
    if (input.website) {
      res.status(202).json({ status: "accepted" });
      return;
    }
    const { website: _ignored, ...message } = input;
    const { id } = await store.save(message);
    await mailer.notifySociety(id);
    res.status(202).json({ status: "accepted" });
  });

  return router;
}
