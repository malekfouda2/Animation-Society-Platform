import { Router } from "express";
import { Email } from "./email.model.js";

/**
 * Development-only local inbox: the last 30 emails, so sign-up and reset links can be followed
 * without an email provider. Mounted only when EMAIL_MODE=mock outside production (see app.ts).
 */
export function devInboxRouter(): Router {
  const router = Router();
  router.get("/dev/inbox", async (_req, res) => {
    const emails = await Email.find({}, { to: 1, locale: 1, template: 1, subject: 1, text: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.set("Cache-Control", "no-store");
    res.json({
      emails: emails.map((e) => ({
        id: String(e._id),
        to: e.to,
        locale: e.locale,
        template: e.template,
        subject: e.subject,
        text: e.text,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  });
  return router;
}
