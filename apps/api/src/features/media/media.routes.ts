import { MEDIA_MAX_BYTES, MEDIA_TYPES } from "@as/contracts";
import express, { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../http/errors.js";
import { createRateLimiter } from "../../http/rate-limit.js";
import { requireRole, requireSameOrigin } from "../auth/auth.middleware.js";
import type { MediaService } from "./media.service.js";

export interface MediaDeps {
  service: MediaService;
  publicOrigin: string;
}

/** Staff upload: the raw image is the request body (no multipart parser needed). */
export function adminMediaRouter({ service, publicOrigin }: MediaDeps): Router {
  const router = Router();
  const allow = createRateLimiter(60, 10 * 60_000);
  router.post(
    "/admin/media",
    requireSameOrigin(publicOrigin),
    requireRole("admin", "editor"),
    express.raw({ type: [...MEDIA_TYPES], limit: MEDIA_MAX_BYTES }),
    async (req, res) => {
      const auth = req.auth;
      if (!auth) throw new HttpError("unauthenticated", "Sign in to continue");
      if (!allow(auth.userId)) throw new HttpError("rate_limited", "Too many uploads; try again later");
      // express.raw leaves the body unparsed (an empty object) for any other content type.
      if (!Buffer.isBuffer(req.body)) throw new HttpError("validation_failed", "Upload a PNG, JPEG or WebP image", { file: ["media_type"] });
      res.status(201).json(await service.upload(auth, req.body, req.get("content-type") ?? ""));
    },
  );
  router.get("/admin/media", requireRole("admin", "editor"), async (req, res) => {
    res.set("Cache-Control", "no-store");
    const q = z.object({ filter: z.enum(["all", "unused"]).default("all"), before: z.string().max(24).optional() }).parse(req.query);
    res.json(await service.list({ unused: q.filter === "unused", ...(q.before ? { before: q.before } : {}) }));
  });

  router.delete("/admin/media/:id", requireSameOrigin(publicOrigin), requireRole("admin", "editor"), async (req, res) => {
    const auth = req.auth;
    if (!auth) throw new HttpError("unauthenticated", "Sign in to continue");
    const { id } = z.object({ id: z.string().max(64) }).parse(req.params);
    await service.remove({ userId: auth.userId, kind: "user" }, id);
    res.status(204).end();
  });
  return router;
}

/** Serves an image to whoever may see it (see MediaService.access). */
export function mediaRouter({ service }: MediaDeps): Router {
  const router = Router();
  router.get("/media/:id", async (req, res) => {
    const access = await service.access(req.params.id, req.auth);
    if (!access) throw new HttpError("not_found", "Resource not found");
    res.set({
      "Content-Type": "image/webp",
      // Public images may be cached briefly; staff-only previews never are.
      "Cache-Control": access.public ? "public, max-age=300" : "private, no-store",
      "Content-Disposition": "inline",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    res.sendFile(service.pathOf(req.params.id), { dotfiles: "deny", headers: {} }, (err) => {
      if (err && !res.headersSent) res.status(404).end();
    });
  });
  return router;
}
