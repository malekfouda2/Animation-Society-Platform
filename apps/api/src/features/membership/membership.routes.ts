import {
  MEDIA_MAX_BYTES,
  MEDIA_TYPES,
  applicationListQuerySchema,
  applicationVersionSchema,
  approveSchema,
  createPlanSchema,
  rejectSchema,
  requestChangesSchema,
  saveApplicationSchema,
  updatePlanSchema,
} from "@as/contracts";
import express, { Router, type Request } from "express";
import { HttpError } from "../../http/errors.js";
import { createRateLimiter } from "../../http/rate-limit.js";
import { requireRole, requireSameOrigin } from "../auth/auth.middleware.js";
import type { MediaService } from "../media/media.service.js";
import type { MembershipService } from "./membership.service.js";

export interface MembershipDeps {
  service: MembershipService;
  media: MediaService;
  publicOrigin: string;
}

function authOf(req: Request) {
  if (!req.auth) throw new HttpError("unauthenticated", "Sign in to continue");
  return req.auth;
}

const param = (req: Request, name: string) => {
  const v = req.params[name];
  return typeof v === "string" ? v : "";
};

/** Plans visitors can read on the membership page. */
export function publicMembershipRouter({ service }: MembershipDeps): Router {
  const router = Router();
  router.get("/membership/plans", async (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.json({ items: await service.publicPlans() });
  });
  return router;
}

/**
 * The applicant's own application. Member accounts only; every query is scoped to the signed-in
 * account, so one member can never name another member's application.
 */
export function accountApplicationRouter({ service, media, publicOrigin }: MembershipDeps): Router {
  const router = Router();
  const allowPhoto = createRateLimiter(20, 60 * 60_000);
  const allowSubmit = createRateLimiter(20, 60 * 60_000);
  router.use("/account/application", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  router.use(["/account/application", "/account/photo"], requireSameOrigin(publicOrigin), requireRole("member"));

  router.get("/account/application", async (req, res) => {
    const auth = authOf(req);
    res.json({ application: await service.mine(auth), plans: await service.publicPlans() });
  });
  router.put("/account/application", async (req, res) => {
    res.json(await service.save(authOf(req), saveApplicationSchema.parse(req.body)));
  });
  router.post("/account/application/submit", async (req, res) => {
    const auth = authOf(req);
    if (!allowSubmit(auth.userId)) throw new HttpError("rate_limited", "Too many attempts; try again later");
    res.json(await service.submit(auth, applicationVersionSchema.parse(req.body).version));
  });

  router.post("/account/application/reapply", async (req, res) => {
    const auth = authOf(req);
    if (!allowSubmit(auth.userId)) throw new HttpError("rate_limited", "Too many attempts; try again later");
    res.json(await service.reapply(auth, applicationVersionSchema.parse(req.body).version));
  });

  /** The applicant's photo for the card: private, re-encoded, metadata stripped (media service). */
  router.post("/account/photo", express.raw({ type: [...MEDIA_TYPES], limit: MEDIA_MAX_BYTES }), async (req, res) => {
    res.set("Cache-Control", "no-store");
    const auth = authOf(req);
    if (!allowPhoto(auth.userId)) throw new HttpError("rate_limited", "Too many uploads; try again later");
    if (!Buffer.isBuffer(req.body)) throw new HttpError("validation_failed", "Upload a PNG, JPEG or WebP image", { file: ["media_type"] });
    res.status(201).json(await media.upload(auth, req.body, req.get("content-type") ?? "", "member_photo"));
  });
  return router;
}

/**
 * Application review and plan settings: administrators only (with the second factor). Content
 * editors get 403 here, whatever the interface shows them.
 */
export function adminMembershipRouter({ service, publicOrigin }: MembershipDeps): Router {
  const router = Router();
  router.use(["/admin/applications", "/admin/plans"], (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  router.use(["/admin/applications", "/admin/plans"], requireSameOrigin(publicOrigin), requireRole("admin"));

  router.get("/admin/applications", async (req, res) => {
    res.json(await service.adminList(applicationListQuerySchema.parse(req.query)));
  });
  router.get("/admin/applications/:id", async (req, res) => {
    res.json(await service.adminGet(param(req, "id")));
  });
  router.post("/admin/applications/:id/request-changes", async (req, res) => {
    const { version, message } = requestChangesSchema.parse(req.body);
    res.json(await service.requestChanges(authOf(req), param(req, "id"), version, message));
  });
  router.post("/admin/applications/:id/approve", async (req, res) => {
    const { version, meetingConfirmed } = approveSchema.parse(req.body);
    res.json(await service.approve(authOf(req), param(req, "id"), version, meetingConfirmed));
  });
  router.post("/admin/applications/:id/reject", async (req, res) => {
    const { version, reason } = rejectSchema.parse(req.body);
    res.json(await service.reject(authOf(req), param(req, "id"), version, reason));
  });

  router.get("/admin/plans", async (_req, res) => {
    res.json({ items: await service.adminPlans() });
  });
  router.get("/admin/plans/:id", async (req, res) => {
    res.json(await service.adminPlan(param(req, "id")));
  });
  router.post("/admin/plans", async (req, res) => {
    res.status(201).json(await service.createPlan(authOf(req), createPlanSchema.parse(req.body)));
  });
  router.patch("/admin/plans/:id", async (req, res) => {
    res.json(await service.updatePlan(authOf(req), param(req, "id"), updatePlanSchema.parse(req.body)));
  });
  return router;
}
