import { createContentSchema, kindFromPath, updateContentSchema, versionSchema, type ContentKind } from "@as/contracts";
import { Router, type Request } from "express";
import { z } from "zod";
import { HttpError } from "../../http/errors.js";
import { requireRole, requireSameOrigin } from "../auth/auth.middleware.js";
import type { ContentService } from "./content.service.js";

export interface ContentDeps {
  service: ContentService;
  publicOrigin: string;
}

function kindOf(req: Request): ContentKind {
  const raw = req.params["kinds"];
  const kind = typeof raw === "string" ? kindFromPath(raw) : null;
  if (!kind) throw new HttpError("not_found", "Resource not found");
  return kind;
}

function authOf(req: Request) {
  if (!req.auth) throw new HttpError("unauthenticated", "Sign in to continue");
  return req.auth;
}

/** Public read API: published copies only. Drafts never leave the staff routes. */
export function publicContentRouter({ service }: ContentDeps): Router {
  const router = Router();
  router.get("/content/:kinds", async (req, res) => {
    const kind = kindOf(req);
    res.set("Cache-Control", "no-cache");
    res.json({ items: await service.publicList(kind) });
  });
  router.get("/content/:kinds/:slug", async (req, res) => {
    const kind = kindOf(req);
    res.set("Cache-Control", "no-cache");
    res.json(await service.publicGet(kind, req.params["slug"]));
  });
  return router;
}

/**
 * Staff editing API. Administrators and content editors only (second factor required); members,
 * payments and roles are not reachable from here. Unsafe methods must carry the site's Origin.
 */
export function adminContentRouter({ service, publicOrigin }: ContentDeps): Router {
  const router = Router();
  const staff = requireRole("admin", "editor");
  router.use("/admin/content", requireSameOrigin(publicOrigin), staff);

  router.get("/admin/content/:kinds", async (req, res) => {
    res.json({ items: await service.list(kindOf(req)) });
  });
  router.post("/admin/content/:kinds", async (req, res) => {
    const kind = kindOf(req);
    res.status(201).json(await service.create(authOf(req), kind, createContentSchema.parse(req.body)));
  });
  router.get("/admin/content/:kinds/:id", async (req, res) => {
    res.json(await service.get(kindOf(req), req.params["id"]));
  });
  router.patch("/admin/content/:kinds/:id", async (req, res) => {
    const kind = kindOf(req);
    res.json(await service.update(authOf(req), kind, req.params["id"], updateContentSchema.parse(req.body)));
  });
  router.post("/admin/content/:kinds/:id/publish", async (req, res) => {
    const kind = kindOf(req);
    res.json(await service.publish(authOf(req), kind, req.params["id"], versionSchema.parse(req.body).version));
  });
  router.post("/admin/content/:kinds/:id/unpublish", async (req, res) => {
    const kind = kindOf(req);
    res.json(await service.unpublish(authOf(req), kind, req.params["id"], versionSchema.parse(req.body).version));
  });
  router.delete("/admin/content/:kinds/:id", async (req, res) => {
    const kind = kindOf(req);
    const { version } = z.object({ version: z.coerce.number().int().min(0) }).parse(req.query);
    await service.remove(authOf(req), kind, req.params["id"], version);
    res.status(204).end();
  });
  return router;
}
