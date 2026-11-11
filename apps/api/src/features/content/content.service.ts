import {
  DRAFT_SCHEMAS,
  isSectionKey,
  mediaIds,
  publishIssues,
  slugSchema,
  type AdminEntry,
  type ContentData,
  type ContentKind,
  type ContentState,
  type PublicEntry,
} from "@as/contracts";
import mongoose, { type ClientSession, type SortOrder } from "mongoose";
import { HttpError } from "../../http/errors.js";
import { audit } from "../audit/audit.model.js";
import type { AuthenticatedSession } from "../auth/auth.service.js";
import { ContentEntry } from "./content.model.js";

interface EntryDoc {
  _id: mongoose.Types.ObjectId;
  kind: string;
  slug: string;
  draft: unknown;
  published: unknown;
  dirty: boolean;
  version: number;
  publishedAt: Date | null;
  firstPublishedAt: Date | null;
  updatedAt: Date;
}

const PUBLIC_SORT: Record<ContentKind, Record<string, SortOrder>> = {
  // Newest dated item first.
  post: { "published.date": -1, firstPublishedAt: -1 },
  // Most recently announced project first (the homepage features the first one).
  project: { firstPublishedAt: -1 },
  // Partners keep the order in which they were first published.
  partner: { firstPublishedAt: 1 },
  section: { slug: 1 },
};

const MAX_LIST = 200;

function stateOf(doc: EntryDoc): ContentState {
  if (doc.published === null || doc.publishedAt === null) return "draft";
  return doc.dirty ? "changed" : "published";
}

function toAdmin<K extends ContentKind>(kind: K, doc: EntryDoc): AdminEntry<K> {
  return {
    id: String(doc._id),
    kind,
    slug: doc.slug,
    state: stateOf(doc),
    version: doc.version,
    draft: doc.draft as AdminEntry<K>["draft"],
    everPublished: doc.firstPublishedAt !== null,
    publishedAt: doc.publishedAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}

function parseDraft(kind: ContentKind, data: unknown): ContentData {
  const result = DRAFT_SCHEMAS[kind].safeParse(data);
  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) (fields[issue.path.join(".") || "data"] ??= []).push(issue.message);
    throw new HttpError("validation_failed", "Check the highlighted fields", fields);
  }
  return result.data;
}

function validId(id: string): void {
  if (!mongoose.isValidObjectId(id)) throw new HttpError("not_found", "Entry not found");
}

/** Title for the activity log, in English when present (the log is read by staff in both languages). */
function titleOf(data: unknown): string {
  const d = data as { title?: { ar?: string; en?: string }; section?: string } | null;
  const t = d?.title;
  return (t?.en || t?.ar || (d?.section ? `section: ${d.section}` : "")).slice(0, 160);
}

/** A fixed page section is addressed by its key, which must match the section it holds. */
function checkSection(kind: ContentKind, slug: string, draft: ContentData): void {
  if (kind !== "section") return;
  if (!isSectionKey(slug) || (draft as { section: string }).section !== slug) {
    throw new HttpError("validation_failed", "Unknown page section", { slug: ["section"] });
  }
}

export interface ContentServiceDeps {
  now?: () => Date;
  /** Checks that referenced images exist; omitted in tests that use no images. */
  media?: { missing(ids: string[]): Promise<string[]> };
}

export function createContentService({ now = () => new Date(), media }: ContentServiceDeps = {}) {
  async function checkMedia(draft: ContentData): Promise<void> {
    if (!media) return;
    const missing = await media.missing(mediaIds(draft));
    if (missing.length > 0) throw new HttpError("validation_failed", "An image is missing; upload it again", { media: ["media_missing"] });
  }

  const transaction = <T>(fn: (session: ClientSession) => Promise<T>) => mongoose.connection.transaction(fn);

  /**
   * Applies one versioned change. A stale version (someone else saved first) is a conflict, not a
   * silent overwrite; a missing entry is a 404.
   */
  async function change(
    auth: AuthenticatedSession,
    kind: ContentKind,
    id: string,
    version: number,
    action: string,
    build: (doc: EntryDoc, at: Date) => Record<string, unknown>,
  ): Promise<AdminEntry> {
    validId(id);
    const at = now();
    return transaction(async (session) => {
      const doc = await ContentEntry.findOne({ _id: id, kind }, null, { session }).lean<EntryDoc>();
      if (!doc) throw new HttpError("not_found", "Entry not found");
      if (doc.version !== version) throw new HttpError("conflict", "Someone else saved this entry; reload to see their changes");
      const set = { ...build(doc, at), updatedAt: at, updatedBy: auth.userId };
      const updated = await ContentEntry.findOneAndUpdate(
        { _id: id, kind, version },
        { $set: set, $inc: { version: 1 } },
        { session, returnDocument: "after" },
      ).lean<EntryDoc>();
      if (!updated) throw new HttpError("conflict", "Someone else saved this entry; reload to see their changes");
      await audit(
        { actorId: auth.userId, actorKind: "user", action, targetType: "content", targetId: id, meta: { kind, slug: updated.slug, title: titleOf(updated.draft) } },
        at,
        session,
      );
      return toAdmin(kind, updated);
    }).catch((err: unknown) => {
      if (isDuplicateKey(err)) throw new HttpError("validation_failed", "That address is already used", { slug: ["slug_taken"] });
      throw err;
    });
  }

  return {
    async list(kind: ContentKind): Promise<AdminEntry[]> {
      const docs = await ContentEntry.find({ kind }).sort({ updatedAt: -1 }).limit(MAX_LIST).lean<EntryDoc[]>();
      return docs.map((d) => toAdmin(kind, d));
    },

    async get(kind: ContentKind, id: string): Promise<AdminEntry> {
      validId(id);
      const doc = await ContentEntry.findOne({ _id: id, kind }).lean<EntryDoc>();
      if (!doc) throw new HttpError("not_found", "Entry not found");
      return toAdmin(kind, doc);
    },

    async create(auth: AuthenticatedSession, kind: ContentKind, input: { slug: string; data: unknown }): Promise<AdminEntry> {
      const draft = parseDraft(kind, input.data);
      checkSection(kind, input.slug, draft);
      await checkMedia(draft);
      const at = now();
      try {
        return await transaction(async (session) => {
          const [doc] = await ContentEntry.create(
            [{ kind, slug: input.slug, draft, published: null, dirty: false, version: 0, createdAt: at, updatedAt: at, createdBy: auth.userId, updatedBy: auth.userId }],
            { session },
          );
          if (!doc) throw new Error("entry not created");
          await audit({ actorId: auth.userId, actorKind: "user", action: "content.created", targetType: "content", targetId: String(doc._id), meta: { kind, slug: input.slug, title: titleOf(draft) } }, at, session);
          return toAdmin(kind, doc.toObject() as EntryDoc);
        });
      } catch (err) {
        if (isDuplicateKey(err)) throw new HttpError("validation_failed", "That address is already used", { slug: ["slug_taken"] });
        throw err;
      }
    },

    /** Saves the working draft. A published entry stays as it was publicly until published again. */
    async update(auth: AuthenticatedSession, kind: ContentKind, id: string, input: { version: number; slug: string; data: unknown }): Promise<AdminEntry> {
      const draft = parseDraft(kind, input.data);
      checkSection(kind, input.slug, draft);
      await checkMedia(draft);
      return change(auth, kind, id, input.version, "content.updated", (doc) => {
        // A published address is shared and indexed; changing it would break those links.
        if ((doc.firstPublishedAt !== null || kind === "section") && input.slug !== doc.slug) {
          throw new HttpError("validation_failed", "The address can't change after publishing", { slug: ["slug_locked"] });
        }
        return { slug: input.slug, draft, dirty: doc.published !== null };
      });
    },

    publish(auth: AuthenticatedSession, kind: ContentKind, id: string, version: number): Promise<AdminEntry> {
      return change(auth, kind, id, version, "content.published", (doc, at) => {
        // Re-validate the stored draft: the schema may have tightened since it was saved.
        const draft = parseDraft(kind, doc.draft);
        const issues = publishIssues(kind, draft);
        if (Object.keys(issues).length > 0) {
          throw new HttpError("validation_failed", "Complete both languages before publishing", issues);
        }
        return { published: draft, dirty: false, publishedAt: at, ...(doc.firstPublishedAt === null ? { firstPublishedAt: at } : {}) };
      });
    },

    /** Takes an entry off the public site. The draft is kept. */
    unpublish(auth: AuthenticatedSession, kind: ContentKind, id: string, version: number): Promise<AdminEntry> {
      return change(auth, kind, id, version, "content.unpublished", (doc) => {
        if (doc.published === null) throw new HttpError("conflict", "This entry isn't published");
        return { published: null, publishedAt: null, dirty: false };
      });
    },

    /** Only entries that are not on the public site can be deleted; the activity log keeps the record. */
    async remove(auth: AuthenticatedSession, kind: ContentKind, id: string, version: number): Promise<void> {
      validId(id);
      // Fixed page sections can be unpublished but never removed.
      if (kind === "section") throw new HttpError("forbidden", "Page sections can't be deleted");
      const at = now();
      await transaction(async (session) => {
        const doc = await ContentEntry.findOne({ _id: id, kind }, null, { session }).lean<EntryDoc>();
        if (!doc) throw new HttpError("not_found", "Entry not found");
        if (doc.version !== version) throw new HttpError("conflict", "Someone else saved this entry; reload to see their changes");
        if (doc.published !== null) throw new HttpError("conflict", "Unpublish this entry before deleting it");
        const { deletedCount } = await ContentEntry.deleteOne({ _id: id, kind, version, published: null }, { session });
        if (deletedCount !== 1) throw new HttpError("conflict", "Someone else saved this entry; reload to see their changes");
        await audit({ actorId: auth.userId, actorKind: "user", action: "content.deleted", targetType: "content", targetId: id, meta: { kind, slug: doc.slug, title: titleOf(doc.draft) } }, at, session);
      });
    },

    async publicList<K extends ContentKind>(kind: K): Promise<PublicEntry<K>[]> {
      const docs = await ContentEntry.find({ kind, publishedAt: { $type: "date" } }, { slug: 1, published: 1, publishedAt: 1 })
        .sort(PUBLIC_SORT[kind])
        .limit(MAX_LIST)
        .lean<{ slug: string; published: unknown; publishedAt: Date }[]>();
      return docs.map((d) => ({ slug: d.slug, kind, publishedAt: d.publishedAt.toISOString(), data: d.published as PublicEntry<K>["data"] }));
    },

    async publicGet<K extends ContentKind>(kind: K, slug: string): Promise<PublicEntry<K>> {
      const parsed = slugSchema.safeParse(slug);
      if (!parsed.success) throw new HttpError("not_found", "Entry not found");
      const doc = await ContentEntry.findOne({ kind, slug: parsed.data, publishedAt: { $type: "date" } }, { slug: 1, published: 1, publishedAt: 1 })
        .lean<{ slug: string; published: unknown; publishedAt: Date }>();
      if (!doc) throw new HttpError("not_found", "Entry not found");
      return { slug: doc.slug, kind, publishedAt: doc.publishedAt.toISOString(), data: doc.published as PublicEntry<K>["data"] };
    },
  };
}

export type ContentService = ReturnType<typeof createContentService>;
