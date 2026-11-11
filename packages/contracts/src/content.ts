import { z } from "zod";

/**
 * Editable public content. Each entry keeps a working draft and, once published, a separate
 * published copy: editing a live entry changes nothing public until it is published again.
 * Validation messages are translation keys (see the admin dictionary's content.errors).
 */
export const CONTENT_KINDS = ["post", "project", "partner", "section"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

/** URL segment for each kind, shared by the public and admin routes. */
export const CONTENT_PATHS = { post: "posts", project: "projects", partner: "partners", section: "sections" } as const satisfies Record<ContentKind, string>;
export type ContentPath = (typeof CONTENT_PATHS)[ContentKind];
export function kindFromPath(path: string): ContentKind | null {
  const hit = CONTENT_KINDS.find((k) => CONTENT_PATHS[k] === path);
  return hit ?? null;
}

/**
 * How the public page labels an entry: approved shows no note; the other two keep the honest
 * "awaiting sign-off" notes used across the site.
 */
export const APPROVALS = ["approved", "supplied", "draft"] as const;
export const POST_TYPES = ["news", "event"] as const;
export const PROJECT_FIELDS = ["2d", "3d", "stop-motion", "hybrid"] as const;
export const PROJECT_PROGRESS = ["ongoing", "upcoming", "completed"] as const;

export const LIMITS = { title: 160, summary: 400, body: 20_000, short: 160, url: 500 } as const;

const text = (max: number) => z.string().trim().max(max, "too_long");
const localized = (max: number) => z.object({ ar: text(max), en: text(max) }).strict();
/** A stable entry ID (MongoDB ObjectId, hex). */
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/, "media");

/**
 * An uploaded image used by an entry, with its description in both languages. The description
 * lives with the entry (the same picture can say different things in different places); it is
 * required in both languages before the entry is published. `id` is empty when there is no image.
 */
/**
 * Which part of the image this use shows, as fractions of the full picture (0..1). The file is never
 * changed; pages draw only this area. The whole picture is { x: 0, y: 0, w: 1, h: 1 }.
 */
export const cropSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().min(0.02).max(1),
    h: z.number().min(0.02).max(1),
  })
  .strict()
  .refine((c) => c.x + c.w <= 1.0001 && c.y + c.h <= 1.0001, "crop");
export type Crop = z.infer<typeof cropSchema>;
export const FULL_CROP: Crop = { x: 0, y: 0, w: 1, h: 1 };
export const isFullCrop = (c: Crop) => c.x <= 0.0001 && c.y <= 0.0001 && c.w >= 0.9999 && c.h >= 0.9999;

export const mediaRefSchema = z
  .object({
    id: z.union([z.literal(""), objectIdSchema]),
    alt: localized(250),
    /** Pixel size reported by the upload, so pages reserve the right space before it loads. */
    width: z.number().int().min(0).max(10_000).default(0),
    height: z.number().int().min(0).max(10_000).default(0),
    crop: cropSchema.default(() => ({ ...FULL_CROP })),
  })
  .strict();
export type MediaRef = z.infer<typeof mediaRefSchema>;
export const NO_MEDIA: MediaRef = { id: "", alt: { ar: "", en: "" }, width: 0, height: 0, crop: FULL_CROP };
/** Entries saved before images existed have no image field; they read as "no image". */
const mediaField = mediaRefSchema.default(() => ({ ...NO_MEDIA, alt: { ar: "", en: "" }, crop: { ...FULL_CROP } }));

/** Empty, or an https link (external registration and partner sites). */
const optionalHttps = z.union([
  z.literal(""),
  z.url({ protocol: /^https$/, error: "url" }).max(LIMITS.url, "url"),
]);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(80, "slug")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug");

export const postDraftSchema = z
  .object({
    approval: z.enum(APPROVALS),
    postType: z.enum(POST_TYPES),
    title: localized(LIMITS.title),
    summary: localized(LIMITS.summary),
    body: localized(LIMITS.body),
    /** Publication date for news, the day of the event for events. */
    date: z.union([z.literal(""), z.iso.date("date")]),
    location: localized(LIMITS.short),
    registrationUrl: optionalHttps,
    image: mediaField,
  })
  .strict();

export const projectDraftSchema = z
  .object({
    approval: z.enum(APPROVALS),
    title: localized(LIMITS.title),
    summary: localized(LIMITS.summary),
    body: localized(LIMITS.body),
    field: z.enum(PROJECT_FIELDS),
    progress: z.enum(PROJECT_PROGRESS),
    progressLabel: localized(LIMITS.short),
    /** Key of an illustrative cover in the site's artwork manifest (the site falls back if unknown). */
    cover: z.string().regex(/^[A-Za-z0-9]{1,40}$/, "cover"),
    /** An uploaded picture of the project; when set it replaces the illustrative cover. */
    image: mediaField,
    externalUrl: optionalHttps,
  })
  .strict();

export const partnerDraftSchema = z
  .object({
    approval: z.enum(APPROVALS),
    /** The partner's name. */
    title: localized(LIMITS.short),
    url: optionalHttps,
    logo: mediaField,
  })
  .strict();

/**
 * Fixed page sections. Each has a fixed key (its address) and its own fields; they can be edited
 * and published like other entries but never created freely or deleted.
 */
export const POLICY_KEYS = ["terms", "privacy", "membership", "payment-refund", "card-use"] as const;
export type PolicyKey = (typeof POLICY_KEYS)[number];
export const GOAL_KEYS = ["content", "festivals", "exchange", "sponsorship"] as const;
export const SECTION_KEYS = ["hero", "about", "vision", "goals", "assembly", "board", ...POLICY_KEYS.map((k) => `policy-${k}` as const)] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const BOARD_MAX = 30;

const approval = z.enum(APPROVALS);
const policySchema = <K extends SectionKey>(key: K) =>
  z.object({ section: z.literal(key), approval, body: localized(LIMITS.body) }).strict();

export const sectionDraftSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("hero"), approval, title: localized(LIMITS.title), body: localized(LIMITS.summary) }).strict(),
  /** `aims` holds one aim per line. */
  z.object({ section: z.literal("about"), approval, intro: localized(2000), aims: localized(1000) }).strict(),
  z.object({ section: z.literal("vision"), approval, vision: localized(LIMITS.summary), mission: localized(LIMITS.summary) }).strict(),
  z.object({
    section: z.literal("goals"),
    approval,
    content: localized(LIMITS.summary),
    festivals: localized(LIMITS.summary),
    exchange: localized(LIMITS.summary),
    sponsorship: localized(LIMITS.summary),
  }).strict(),
  z.object({ section: z.literal("assembly"), approval, body: localized(2000), votingNote: localized(LIMITS.summary) }).strict(),
  z.object({
    section: z.literal("board"),
    approval,
    members: z
      .array(z.object({ name: localized(120), role: localized(120), portrait: mediaField }).strict())
      .max(BOARD_MAX, "too_many"),
  }).strict(),
  policySchema("policy-terms"),
  policySchema("policy-privacy"),
  policySchema("policy-membership"),
  policySchema("policy-payment-refund"),
  policySchema("policy-card-use"),
]);
export type SectionData = z.infer<typeof sectionDraftSchema>;
export type SectionOf<K extends SectionKey> = Extract<SectionData, { section: K }>;
export function isSectionKey(key: string): key is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(key);
}

export type PostData = z.infer<typeof postDraftSchema>;
export type ProjectData = z.infer<typeof projectDraftSchema>;
export type PartnerData = z.infer<typeof partnerDraftSchema>;
export interface ContentDataByKind {
  post: PostData;
  project: ProjectData;
  partner: PartnerData;
  section: SectionData;
}
export type ContentData = ContentDataByKind[ContentKind];

export const DRAFT_SCHEMAS = {
  post: postDraftSchema,
  project: projectDraftSchema,
  partner: partnerDraftSchema,
  section: sectionDraftSchema,
} as const satisfies Record<ContentKind, z.ZodType>;

export function emptyDraft<K extends Exclude<ContentKind, "section">>(kind: K): Omit<ContentDataByKind, "section">[K] {
  const blank = { ar: "", en: "" };
  const drafts: Omit<ContentDataByKind, "section"> = {
    post: { approval: "approved", postType: "news", title: blank, summary: blank, body: blank, date: "", location: blank, registrationUrl: "", image: NO_MEDIA },
    project: { approval: "approved", title: blank, summary: blank, body: blank, field: "2d", progress: "ongoing", progressLabel: blank, cover: "coverRibbons", image: NO_MEDIA, externalUrl: "" },
    partner: { approval: "approved", title: blank, url: "", logo: NO_MEDIA },
  };
  return drafts[kind];
}

export function emptySection(key: SectionKey): SectionData {
  const b = { ar: "", en: "" };
  const base = { approval: "approved" as const };
  switch (key) {
    case "hero": return { ...base, section: key, title: b, body: b };
    case "about": return { ...base, section: key, intro: b, aims: b };
    case "vision": return { ...base, section: key, vision: b, mission: b };
    case "goals": return { ...base, section: key, content: b, festivals: b, exchange: b, sponsorship: b };
    case "assembly": return { ...base, section: key, body: b, votingNote: b };
    case "board": return { ...base, section: key, members: [] };
    default: return { ...base, section: key, body: b };
  }
}

/**
 * What still blocks publishing a draft: every public text needs both languages, so neither the
 * Arabic nor the English page is ever half-empty. Keys are field paths (e.g. "title.ar").
 */
export function publishIssues(kind: ContentKind, data: ContentData): Record<string, string[]> {
  const issues: Record<string, string[]> = {};
  const need = (path: string, value: string) => {
    if (value.trim() === "") issues[path] = ["required"];
  };
  const pair = (name: string, value: { ar: string; en: string }) => {
    need(`${name}.ar`, value.ar);
    need(`${name}.en`, value.en);
  };
  /** Optional, but when one language is given the other must be too. */
  const both = (name: string, value: { ar: string; en: string }) => {
    if (value.ar.trim() !== "" || value.en.trim() !== "") pair(name, value);
  };
  /** An image needs its description in both languages. */
  const media = (name: string, value: MediaRef) => {
    if (value.id !== "") pair(`${name}.alt`, value.alt);
  };
  if (kind === "section") {
    const d = data as SectionData;
    switch (d.section) {
      case "hero": pair("title", d.title); pair("body", d.body); break;
      case "about": pair("intro", d.intro); pair("aims", d.aims); break;
      case "vision": pair("vision", d.vision); both("mission", d.mission); break;
      case "goals": for (const k of GOAL_KEYS) pair(k, d[k]); break;
      case "assembly": pair("body", d.body); both("votingNote", d.votingNote); break;
      case "board":
        d.members.forEach((m, i) => { pair(`members.${i}.name`, m.name); pair(`members.${i}.role`, m.role); media(`members.${i}.portrait`, m.portrait); });
        break;
      default: pair("body", d.body);
    }
    return issues;
  }
  const entry = data as PostData | ProjectData | PartnerData;
  pair("title", entry.title);
  if (kind === "post") {
    const d = data as PostData;
    pair("summary", d.summary);
    pair("body", d.body);
    need("date", d.date);
    both("location", d.location);
    media("image", d.image);
  } else if (kind === "project") {
    const d = data as ProjectData;
    pair("summary", d.summary);
    pair("body", d.body);
    pair("progressLabel", d.progressLabel);
    media("image", d.image);
  } else {
    need("url", (data as PartnerData).url);
    media("logo", (data as PartnerData).logo);
  }
  return issues;
}

/** Paragraphs are separated by a blank line in the editor. */
export function paragraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p !== "");
}

export const CONTENT_STATES = ["draft", "published", "changed"] as const;
export type ContentState = (typeof CONTENT_STATES)[number];

export const createContentSchema = z.object({ slug: slugSchema, data: z.unknown() }).strict();
export const updateContentSchema = z.object({ version: z.number().int().min(0), slug: slugSchema, data: z.unknown() }).strict();
export const versionSchema = z.object({ version: z.number().int().min(0) }).strict();

const isoDateTime = z.string();

/** Staff view of one entry. */
export const adminEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(CONTENT_KINDS),
  slug: z.string(),
  state: z.enum(CONTENT_STATES),
  version: z.number(),
  draft: z.unknown(),
  everPublished: z.boolean(),
  publishedAt: isoDateTime.nullable(),
  updatedAt: isoDateTime,
});
/** Media IDs an entry refers to (for existence checks and public access to its images). */
export function mediaIds(data: ContentData): string[] {
  const refs: MediaRef[] = [];
  if ("image" in data) refs.push(data.image);
  if ("logo" in data) refs.push(data.logo);
  if ("members" in data) refs.push(...data.members.map((m) => m.portrait));
  return refs.map((r) => r.id).filter((id) => id !== "");
}

/** Accepted upload formats; images are re-encoded to WebP and stripped of metadata on the server. */
export const MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
export const mediaUploadedSchema = z.object({ id: z.string(), width: z.number(), height: z.number() });
export type MediaUploaded = z.infer<typeof mediaUploadedSchema>;

/** Staff media library entry. `uses` counts entries (draft or published) that refer to it. */
export const mediaItemSchema = z.object({
  id: z.string(),
  width: z.number(),
  height: z.number(),
  bytes: z.number(),
  createdAt: z.string(),
  uses: z.number(),
});
export type MediaItem = z.infer<typeof mediaItemSchema>;
export const mediaListSchema = z.object({ items: z.array(mediaItemSchema), next: z.string().nullable() });

/** Image IDs referred to by stored entry data of any age or shape (tolerates missing fields). */
export function referencedMediaIds(data: unknown): string[] {
  if (data === null || typeof data !== "object") return [];
  const d = data as { image?: { id?: unknown }; logo?: { id?: unknown }; members?: unknown };
  const ids: unknown[] = [d.image?.id, d.logo?.id];
  if (Array.isArray(d.members)) for (const m of d.members) ids.push((m as { portrait?: { id?: unknown } } | null)?.portrait?.id);
  return ids.filter((id): id is string => typeof id === "string" && /^[a-f0-9]{24}$/.test(id));
}

export type AdminEntry<K extends ContentKind = ContentKind> = Omit<z.infer<typeof adminEntrySchema>, "draft" | "kind"> & {
  kind: K;
  draft: ContentDataByKind[K];
};

/** Public view: only the published copy, never the draft. */
export interface PublicEntry<K extends ContentKind = ContentKind> {
  slug: string;
  kind: K;
  publishedAt: string;
  data: ContentDataByKind[K];
}
