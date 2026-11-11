import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MEDIA_TYPES, referencedMediaIds, type MediaItem } from "@as/contracts";
import mongoose from "mongoose";
import sharp, { type Metadata, type OutputInfo } from "sharp";
import { HttpError } from "../../http/errors.js";
import { audit } from "../audit/audit.model.js";
import type { AuthenticatedSession } from "../auth/auth.service.js";
import { ContentEntry } from "../content/content.model.js";
import { MediaAsset } from "./media.model.js";

/** Longest side kept; larger pictures are scaled down (never up). */
const MAX_SIDE = 2400;
/** Decompression-bomb guard: refuse images with more pixels than this before decoding them. */
const MAX_INPUT_PIXELS = 40_000_000;
const FORMAT_OF: Record<(typeof MEDIA_TYPES)[number], string> = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" };

/** Uploads younger than this are never pruned: they may belong to a draft that hasn't been saved yet. */
export const PRUNE_GRACE_MS = 24 * 60 * 60 * 1000;
const PAGE = 60;

function invalid(reason: "media_type" | "media_unreadable" | "media_small"): never {
  throw new HttpError("validation_failed", "This file can't be used as an image", { file: [reason] });
}

export function createMediaService({ dir, now = () => new Date() }: { dir: string; now?: () => Date }) {
  const pathOf = (id: string) => join(dir, `${id}.webp`);

  return {
    pathOf,

    /**
     * Checks the declared type against the file's real format, decodes it with a pixel limit, applies
     * the camera orientation, scales it down if needed and re-encodes it as WebP. Re-encoding drops
     * all metadata (camera, location) and anything hidden in the original file.
     */
    async upload(auth: AuthenticatedSession, body: Buffer, contentType: string) {
      const declared = MEDIA_TYPES.find((t) => contentType.toLowerCase().startsWith(t));
      if (!declared || body.length === 0) invalid("media_type");
      let meta: Metadata;
      try {
        meta = await sharp(body, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).metadata();
      } catch {
        invalid("media_unreadable");
      }
      if (meta.format !== FORMAT_OF[declared]) invalid("media_type");
      if ((meta.pages ?? 1) > 1) invalid("media_type");
      if (meta.width < 16 || meta.height < 16) invalid("media_small");

      let out: { data: Buffer; info: OutputInfo };
      try {
        out = await sharp(body, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
          .rotate()
          .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });
      } catch {
        invalid("media_unreadable");
      }

      const id = new mongoose.Types.ObjectId();
      const at = now();
      await mkdir(dir, { recursive: true });
      // Written under a temporary name and renamed, so a half-written file is never served.
      const tmp = join(dir, `.${randomUUID()}.tmp`);
      await writeFile(tmp, out.data, { mode: 0o640 });
      await rename(tmp, pathOf(String(id)));
      try {
        await MediaAsset.create({
          _id: id,
          mime: "image/webp",
          width: out.info.width,
          height: out.info.height,
          bytes: out.data.length,
          sha256: createHash("sha256").update(out.data).digest("hex"),
          sourceFormat: meta.format,
          createdBy: auth.userId,
          createdAt: at,
        });
        await audit({ actorId: auth.userId, actorKind: "user", action: "media.uploaded", targetType: "media", targetId: String(id), meta: { width: out.info.width, height: out.info.height, bytes: out.data.length } }, at);
      } catch (err) {
        await rm(pathOf(String(id)), { force: true });
        throw err;
      }
      return { id: String(id), width: out.info.width, height: out.info.height };
    },

    /**
     * How many entries refer to each image, counting drafts as well as published copies, so an image
     * chosen in an unsaved-for-publishing draft is still "in use".
     */
    async usage(): Promise<Map<string, number>> {
      const entries = await ContentEntry.find({}, { draft: 1, published: 1 }).lean<{ draft: unknown; published: unknown }[]>();
      const counts = new Map<string, number>();
      for (const e of entries) {
        for (const id of new Set([...referencedMediaIds(e.draft), ...referencedMediaIds(e.published)])) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return counts;
    },

    /** The staff library, newest first, optionally only images nothing uses. */
    async list({ unused = false, before }: { unused?: boolean; before?: string }): Promise<{ items: MediaItem[]; next: string | null }> {
      const counts = await this.usage();
      const filter: Record<string, unknown> = {};
      if (before && mongoose.isValidObjectId(before)) filter["_id"] = { $lt: new mongoose.Types.ObjectId(before) };
      if (unused) filter["_id"] = { ...(filter["_id"] as object | undefined), $nin: [...counts.keys()].map((id) => new mongoose.Types.ObjectId(id)) };
      const docs = await MediaAsset.find(filter).sort({ _id: -1 }).limit(PAGE + 1).lean();
      const page = docs.slice(0, PAGE);
      return {
        items: page.map((d) => ({ id: String(d._id), width: d.width, height: d.height, bytes: d.bytes, createdAt: d.createdAt.toISOString(), uses: counts.get(String(d._id)) ?? 0 })),
        next: docs.length > PAGE ? String(page.at(-1)?._id) : null,
      };
    },

    /** Deletes an image nothing refers to (record first, then the file). Images in use are kept. */
    async remove(actor: { userId: string | null; kind: "user" | "cli" }, id: string): Promise<void> {
      if (!mongoose.isValidObjectId(id)) throw new HttpError("not_found", "Image not found");
      const asset = await MediaAsset.findById(id).lean();
      if (!asset) throw new HttpError("not_found", "Image not found");
      if ((await this.usage()).has(id)) throw new HttpError("conflict", "This image is still used; remove it from those entries first");
      await MediaAsset.deleteOne({ _id: id });
      await rm(pathOf(id), { force: true });
      await audit({ actorId: actor.userId, actorKind: actor.kind, action: "media.deleted", targetType: "media", targetId: id, meta: { width: asset.width, height: asset.height, bytes: asset.bytes } }, now());
    },

    /** Unused uploads older than the grace period: what `media prune` deletes. */
    async pruneCandidates(olderThanMs = PRUNE_GRACE_MS): Promise<string[]> {
      const counts = await this.usage();
      const cutoff = new Date(now().getTime() - olderThanMs);
      const old = await MediaAsset.find({ createdAt: { $lt: cutoff } }, { _id: 1 }).lean();
      return old.map((d) => String(d._id)).filter((id) => !counts.has(id));
    },

    /** IDs from the list that don't name an uploaded image. */
    async missing(ids: string[]): Promise<string[]> {
      if (ids.length === 0) return [];
      const found = await MediaAsset.find({ _id: { $in: ids } }, { _id: 1 }).lean();
      const have = new Set(found.map((f) => String(f._id)));
      return ids.filter((id) => !have.has(id));
    },

    /**
     * Who may see an image: anyone once a published entry uses it; otherwise only signed-in staff
     * (so a picture uploaded for a draft stays private until that draft is published).
     */
    async access(id: string, auth: AuthenticatedSession | undefined): Promise<{ width: number; height: number; public: boolean } | null> {
      if (!mongoose.isValidObjectId(id)) return null;
      const asset = await MediaAsset.findById(id, { width: 1, height: 1 }).lean();
      if (!asset) return null;
      const used = await ContentEntry.exists({
        publishedAt: { $type: "date" },
        $or: [{ "published.image.id": id }, { "published.logo.id": id }, { "published.members.portrait.id": id }],
      });
      if (used) return { width: asset.width, height: asset.height, public: true };
      if (auth?.staff && auth.mfaVerified) return { width: asset.width, height: asset.height, public: false };
      return null;
    },
  };
}

export type MediaService = ReturnType<typeof createMediaService>;
