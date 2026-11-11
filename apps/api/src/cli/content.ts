/**
 * Operator command for public content.
 *
 *   npm run content -w @as/api -- seed
 *
 * `seed` adds the content that existed before content publishing (the Society's Motion Analysis
 * Challenges initiative, paraphrased from its 2024 report, and the homepage and About sections) and
 * publishes it with the same "awaiting sign-off" notes it carried before. It skips anything whose
 * address already exists, so it is safe to run again. It adds no news, events, partners, board
 * members or policies: none have been supplied, and none are invented.
 */
import { DRAFT_SCHEMAS, publishIssues, type ContentKind } from "@as/contracts";
import { loadEnv } from "../config/env.js";
import { connectDatabase } from "../db/mongo.js";
import { audit } from "../features/audit/audit.model.js";
import { ContentEntry } from "../features/content/content.model.js";

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
  {
    // Developer draft from Malek's brief (aims) and Society materials.
    slug: "about",
    data: {
      section: "about",
      approval: "draft",
      intro: {
        ar: "جمعية الرسوم المتحركة جمعية سعودية تدعم فن الرسوم المتحركة وصنّاعه. نعمل على تنمية المهارات، وتشجيع الإبداع، وربط المحترفين والهواة والطلاب في مجتمع واحد يتعلّم ويصنع ويشارك أعماله.",
        en: "The Animation Society is a Saudi association that supports the art of animation and the people who make it. We develop skills, encourage creativity, and connect professionals, newcomers and students in one community that learns, makes and shares work together.",
      },
      aims: {
        ar: ["دعم الرسوم المتحركة في المملكة", "تنمية المهارات", "تشجيع الإبداع", "ربط المحترفين"].join("\n"),
        en: ["Support animation in Saudi Arabia", "Develop skills", "Encourage creativity", "Connect professionals"].join("\n"),
      },
    },
  },
  {
    // English: Promo Vid.mp4 (Jul 2022). Arabic: developer translation, so the section stays "draft".
    // The mission is pending (only the superseded Arabic film has one).
    slug: "vision",
    data: {
      section: "vision",
      approval: "draft",
      vision: {
        ar: "أن نكون روّادًا في صناعة الرسوم المتحركة، وأن نعزّز مكانة هذه الصناعة في المملكة العربية السعودية.",
        en: "To be pioneers in the animation industry and to strengthen the position of this industry in the Kingdom of Saudi Arabia.",
      },
      mission: { ar: "", en: "" },
    },
  },
  {
    // Society introduction films (English Jul 2022 for the set and order; Arabic wording from the Mar 2022 film).
    slug: "goals",
    data: {
      section: "goals",
      approval: "supplied",
      content: {
        ar: "تطوير المحتوى المرتبط بالأنميشن بشكل مباشر أو غير مباشر بتقديم استشارات متخصصة.",
        en: "Develop animation content, both directly and indirectly, through specialized consultations.",
      },
      festivals: {
        ar: "تأسيس مهرجان لأفلام الرسوم المتحركة واستهداف رعاية الشركات المحلية والقطاع الحكومي لتعزيز الهوية الوطنية المرتبطة في الرسوم المتحركة.",
        en: "Organize animation film festivals and promote the national identity associated with animation through sponsorship from local companies and government sectors.",
      },
      exchange: {
        ar: "توفير فرص تطويرية بتبادل الخبرات في مجال الرسوم المتحركة.",
        en: "Provide opportunities for development through exchange of experiences in the field of animation.",
      },
      sponsorship: {
        ar: "رعاية كل ما يندرج تحت تخصص الرسوم المتحركة.",
        en: "Sponsor every aspect that falls under the field of animation.",
      },
    },
  },
  {
    // Developer draft from the Society's membership material (Instagram highlight 'العضويات').
    slug: "assembly",
    data: {
      section: "assembly",
      approval: "draft",
      body: {
        ar: "الجمعية العمومية هي أعلى جهة في الجمعية، وتضم الأعضاء العاملين الذين يحق لهم حضور اجتماعاتها والتصويت على قراراتها والترشّح لعضوية مجلس الإدارة. ومن صلاحياتها منح العضوية الفخرية والشرفية.",
        en: "The General Assembly is the Society's highest body. It brings together working members, who may attend its meetings, vote on its decisions and stand for the Board of Directors. It also grants honorary and distinguished memberships.",
      },
      votingNote: {
        ar: "حق التصويت مرتبط بالعضوية العاملة وشروطها، ولا يُكتسب بمجرد دفع رسوم العضوية.",
        en: "Voting rights come with working membership and its conditions. Paying a membership fee does not grant them on its own.",
      },
    },
  },
];

async function main() {
  const env = loadEnv();
  const command = process.argv[2];
  if (command !== "seed") {
    process.stderr.write("Usage: npm run content -w @as/api -- seed\n");
    process.exit(1);
  }
  const db = await connectDatabase(env.MONGODB_URI);
  try {
    const now = new Date();
    const items: { kind: ContentKind; slug: string; data: unknown }[] = [
      ...SUPPLIED_PROJECTS.map((p) => ({ kind: "project" as const, ...p })),
      ...SUPPLIED_SECTIONS.map((p) => ({ kind: "section" as const, ...p })),
    ];
    for (const { kind, slug, data } of items) {
      const draft = DRAFT_SCHEMAS[kind].parse(data);
      if (Object.keys(publishIssues(kind, draft)).length > 0) throw new Error(`${kind} ${slug} is incomplete`);
      if (await ContentEntry.exists({ kind, slug })) {
        process.stdout.write(`skipped ${kind} ${slug} (already exists)\n`);
        continue;
      }
      const doc = await ContentEntry.create({
        kind, slug, draft, published: draft, dirty: false, version: 0,
        publishedAt: now, firstPublishedAt: now, createdAt: now, updatedAt: now,
      });
      const title = "title" in draft ? draft.title.en : `section: ${slug}`;
      await audit({ actorId: null, actorKind: "cli", action: "content.published", targetType: "content", targetId: String(doc._id), meta: { kind, slug, title } }, now);
      process.stdout.write(`published ${kind} ${slug}\n`);
    }
  } finally {
    await db.disconnect();
  }
}

void main();
