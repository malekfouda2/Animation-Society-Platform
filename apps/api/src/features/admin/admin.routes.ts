import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../auth/auth.middleware.js";
import { AuditEvent } from "../audit/audit.model.js";
import { User } from "../auth/auth.models.js";

/** Staff area API. Every route checks role (and the second factor) on the server. */
export function adminRouter(): Router {
  const router = Router();
  router.use("/admin", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  router.get("/admin/overview", requireRole("admin", "editor"), (req, res) => {
    res.json({ role: req.auth?.role });
  });

  /** Recent material actions, newest first. Administrators only. */
  router.get("/admin/audit", requireRole("admin"), async (req, res) => {
    const { before } = z.object({ before: z.iso.datetime().optional() }).parse(req.query);
    const events = await AuditEvent.find(before ? { at: { $lt: new Date(before) } } : {})
      .sort({ at: -1 })
      .limit(50)
      .lean();
    // Staff see who did what by email; IDs alone are not readable.
    const ids = [...new Set(events.flatMap((e) => [e.actorId ? String(e.actorId) : null, e.targetType === "user" ? e.targetId : null]).filter((v): v is string => v !== null))];
    const users = await User.find({ _id: { $in: ids } }, { email: 1 }).lean();
    const emailOf = new Map(users.map((u) => [String(u._id), u.email]));
    res.json({
      events: events.map((e) => ({
        id: String(e._id),
        at: e.at.toISOString(),
        actorId: e.actorId ? String(e.actorId) : null,
        actorEmail: e.actorId ? emailOf.get(String(e.actorId)) ?? null : null,
        actorKind: e.actorKind,
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        targetEmail: e.targetType === "user" ? emailOf.get(e.targetId) ?? null : null,
        // Content entries are named by the title recorded at the time (the entry may since be deleted).
        targetLabel: e.targetType === "content" && typeof (e.meta as { title?: unknown } | null)?.title === "string" ? (e.meta as { title: string }).title : null,
        reason: e.reason ?? null,
      })),
    });
  });
  return router;
}
