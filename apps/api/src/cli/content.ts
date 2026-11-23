/**
 * Operator command for public content.
 *
 *   npm run content -w @as/api -- seed
 *
 *   npm run content -w @as/api -- profile-2026 --images <folder> --by <admin email>
 *
 * `seed` adds the starting content (the Motion Analysis Challenges initiative from the 2024 report,
 * the homepage hero, and the About, vision, goals, General Assembly and policy sections and the
 * initiatives from the Society's 2026 profile and bylaws). It skips anything whose address already
 * exists, so it is safe to run again.
 *
 * `profile-2026` brings an existing site up to the 2026 profile: it replaces those sections, adds
 * the initiatives, and uploads the board and General Assembly portraits and the partner logos from
 * the folder scripts/brand/extract-profile-images.py writes, acting as the named administrator.
 * Running it again replaces the text and uploads the images again; the earlier copies become unused
 * and `media prune` removes them.
 */
import { DRAFT_SCHEMAS, publishIssues, type ContentKind } from "@as/contracts";
import { loadEnv } from "../config/env.js";
import { connectDatabase } from "../db/mongo.js";
import { audit } from "../features/audit/audit.model.js";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ContentEntry } from "../features/content/content.model.js";
import { User } from "../features/auth/auth.models.js";
import { createMediaService } from "../features/media/media.service.js";
import * as P from "./society-profile-2026.js";

const SUPPLIED_PROJECTS = [
  {
    slug: "motion-analysis-challenges",
    data: {
      approval: "supplied",
      title: { ar: "مبادرة تحديات تحليل الحركة", en: "Motion Analysis Challenges" },
      summary: {
        ar: "تحديات دورية في الرسم من الحياة، مثل رسم الإيماءات والخطوط الكنتورية، تبني الأساس الذي يحتاجه كل رسّام حركة.",
        en: "Regular life-drawing challenges, such as gesture and contour drawing, that build the foundation every animator needs.",
      },
      body: {
        ar: [
          "الرسم من الحياة أساس فهم التعبير البشري والحيواني، والتناسب والتوازن والوزن والوضعية، وهي مهارات لا غنى عنها لإتقان الرسوم المتحركة.",
          "تدعو المبادرة المشاركين إلى استكشاف هذه الأساسيات عبر تحديات قائمة على الملاحظة والرؤية، وتُنشر الأعمال المشاركة على منصات الجمعية.",
          "من أهدافها التوعية بأهم المهارات والتقنيات للمبتدئين وغيرهم، وقياس مستوى المجتمع في هذه المهارات، والتعرّف على المواهب في المملكة، وبناء جسور بين تخصصات الفنون.",
        ].join("\n\n"),
        en: [
          "Drawing from life is the basis for understanding human and animal expression, proportion, balance, weight and pose: skills every animator needs.",
          "The initiative invites participants to explore these fundamentals through observation challenges, and shares their entries on the Society's platforms.",
          "Its aims include raising awareness of core skills for beginners and others, gauging the community's level in these skills, discovering talent in Saudi Arabia and building bridges between art disciplines.",
        ].join("\n\n"),
      },
      field: "2d",
      progress: "ongoing",
      progressLabel: { ar: "مستمرة، وتحدياتها القادمة مجدولة حتى ٢٠٢٧", en: "Ongoing, with upcoming challenges scheduled to 2027" },
      cover: "coverRibbons",
      externalUrl: "",
    },
  },
];

/** Sections moved out of the web code (apps/web/src/content/society.ts before 11 Nov 2026). */
/** Sections: the homepage hero (Malek's brief) and the rest from the Society's 2026 profile and bylaws. */
const SUPPLIED_SECTIONS = [
  {
    // Malek, homepage brief 3 Nov 2026.
    slug: "hero",
    data: {
      section: "hero",
      approval: "supplied",
      title: { ar: "مساحة تجمع مبدعي الرسوم المتحركة", en: "A place for animation creators to connect." },
      body: {
        ar: "تعرّف على الجمعية ومجالات الرسوم المتحركة ومبادراتها، وكن جزءًا من مجتمعها الإبداعي في المملكة العربية السعودية.",
        en: "Discover the Society, the disciplines of animation and its initiatives, and become part of its creative community in Saudi Arabia.",
      },
    },
  },
  { slug: "about", data: { section: "about", approval: "supplied", ...P.ABOUT } },
  { slug: "vision", data: { section: "vision", approval: "supplied", ...P.VISION } },
  { slug: "goals", data: { section: "goals", approval: "supplied", items: P.GOALS } },
  { slug: "assembly", data: { section: "assembly", approval: "supplied", ...P.ASSEMBLY_TEXT, members: [] as unknown[] } },
  { slug: "policy-privacy", data: { section: "policy-privacy", approval: "supplied", body: P.POLICIES.privacy } },
  { slug: "policy-membership", data: { section: "policy-membership", approval: "supplied", body: P.POLICIES.membership } },
  { slug: "policy-payment-refund", data: { section: "policy-payment-refund", approval: "supplied", body: P.POLICIES.paymentRefund } },
];

/** Text-only entries from the profile: the initiatives (no images, illustrative covers). */
const PROFILE_PROJECTS = P.INITIATIVES.map((x) => ({
  slug: x.slug,
  data: {
    approval: "supplied",
    title: x.title,
    summary: x.summary,
    body: x.summary,
    field: "",
    progress: x.progress,
    progressLabel: x.progressLabel,
    cover: x.cover,
    externalUrl: "",
  },
}));

interface Item { kind: ContentKind; slug: string; data: unknown }

/** Validates an entry and writes it as published. `replace` overwrites an existing entry's text. */
async function publish({ kind, slug, data }: Item, now: Date, replace: boolean) {
  const draft = DRAFT_SCHEMAS[kind].parse(data);
  const issues = publishIssues(kind, draft);
  if (Object.keys(issues).length > 0) throw new Error(`${kind} ${slug} is incomplete: ${Object.keys(issues).join(", ")}`);
  const title = "title" in draft ? draft.title.en : `section: ${slug}`;
  const existing = await ContentEntry.findOne({ kind, slug }, { _id: 1 }).lean();
  if (existing && !replace) {
    process.stdout.write(`skipped ${kind} ${slug} (already exists)\n`);
    return;
  }
  if (existing) {
    await ContentEntry.updateOne(
      { _id: existing._id },
      { $set: { draft, published: draft, dirty: false, publishedAt: now, updatedAt: now }, $inc: { version: 1 } },
    );
    await audit({ actorId: null, actorKind: "cli", action: "content.published", targetType: "content", targetId: String(existing._id), meta: { kind, slug, title, source: "profile-2026" } }, now);
    process.stdout.write(`replaced ${kind} ${slug}\n`);
    return;
  }
  const doc = await ContentEntry.create({
    kind, slug, draft, published: draft, dirty: false, version: 0,
    publishedAt: now, firstPublishedAt: now, createdAt: now, updatedAt: now,
  });
  await audit({ actorId: null, actorKind: "cli", action: "content.published", targetType: "content", targetId: String(doc._id), meta: { kind, slug, title } }, now);
  process.stdout.write(`published ${kind} ${slug}\n`);
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const USAGE = [
  "Usage:",
  "  npm run content -w @as/api -- seed",
  "  npm run content -w @as/api -- profile-2026 --images <folder> --by <admin email>",
  "",
].join("\n");

async function main() {
  const env = loadEnv();
  const command = process.argv[2];
  if (command !== "seed" && command !== "profile-2026") {
    process.stderr.write(USAGE);
    process.exit(1);
  }
  const db = await connectDatabase(env.MONGODB_URI);
  try {
    const now = new Date();
    if (command === "seed") {
      const items: Item[] = [
        ...SUPPLIED_PROJECTS.map((x) => ({ kind: "project" as const, ...x })),
        ...PROFILE_PROJECTS.map((x) => ({ kind: "project" as const, ...x })),
        ...SUPPLIED_SECTIONS.map((x) => ({ kind: "section" as const, ...x })),
      ];
      for (const item of items) await publish(item, now, false);
      return;
    }

    // profile-2026: replace the sections from the profile and bylaws, add the initiatives, and add
    // the board, General Assembly and partners with their images.
    const folder = arg("images");
    const by = arg("by");
    if (!folder || !by) {
      process.stderr.write(USAGE);
      process.exit(1);
    }
    // Check every text entry before uploading anything, so a bad entry stops the run cleanly.
    for (const x of [...SUPPLIED_SECTIONS.map((y) => ({ kind: "section" as const, ...y })), ...PROFILE_PROJECTS.map((y) => ({ kind: "project" as const, ...y }))]) {
      const draft = DRAFT_SCHEMAS[x.kind].parse(x.data);
      if (Object.keys(publishIssues(x.kind, draft)).length > 0) throw new Error(`${x.kind} ${x.slug} is incomplete`);
    }
    const actor = await User.findOne({ email: by.toLowerCase(), role: "admin" }, { _id: 1, email: 1, name: 1, locale: 1 }).lean();
    if (!actor) throw new Error(`no administrator with the email ${by}`);
    const media = createMediaService({ dir: resolve(env.MEDIA_DIR) });
    // The upload records the administrator as its author; this command acts on their behalf.
    const auth = { sessionId: "cli", userId: String(actor._id), role: "admin", locale: actor.locale, email: actor.email, name: actor.name, staff: true, mfaVerified: true, reauthAt: null, startedAt: now } as const;
    const uploaded = new Map<string, { id: string; width: number; height: number }>();
    const image = async (file: string | null, alt: { ar: string; en: string }) => {
      if (file === null) return { id: "", alt: { ar: "", en: "" }, width: 0, height: 0, crop: { x: 0, y: 0, w: 1, h: 1 } };
      let up = uploaded.get(file);
      if (!up) {
        up = await media.upload(auth, await readFile(join(folder, `${file}.png`)), "image/png");
        uploaded.set(file, up);
      }
      return { id: up.id, alt, width: up.width, height: up.height, crop: { x: 0, y: 0, w: 1, h: 1 } };
    };
    const people = async (list: readonly P.Person[]) =>
      Promise.all(list.map(async (x) => ({
        name: x.name,
        role: x.role,
        portrait: await image(x.image, { ar: `صورة ${x.name.ar}`, en: `Portrait of ${x.name.en}` }),
      })));

    const items: Item[] = [
      ...SUPPLIED_SECTIONS.filter((x) => x.slug !== "hero" && x.slug !== "assembly").map((x) => ({ kind: "section" as const, ...x })),
      { kind: "section", slug: "assembly", data: { section: "assembly", approval: "supplied", ...P.ASSEMBLY_TEXT, members: await people(P.ASSEMBLY) } },
      { kind: "section", slug: "board", data: { section: "board", approval: "supplied", members: await people(P.BOARD) } },
      ...PROFILE_PROJECTS.map((x) => ({ kind: "project" as const, ...x })),
    ];
    for (const x of P.PARTNERS) {
      items.push({
        kind: "partner",
        slug: x.slug,
        data: { approval: "supplied", title: x.title, url: "", logo: await image(x.image, { ar: `شعار ${x.title.ar}`, en: `${x.title.en} logo` }) },
      });
    }
    for (const item of items) await publish(item, now, true);
    process.stdout.write(`uploaded ${uploaded.size} images\n`);
  } finally {
    await db.disconnect();
  }
}

void main();
