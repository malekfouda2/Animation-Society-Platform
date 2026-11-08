import type { ArtworkKey } from "@/config/artwork";
import type { ContentStatus, Localized } from "./types";

export interface Initiative {
  slug: string;
  status: ContentStatus;
  source: string;
  title: Localized;
  summary: Localized;
  body: Localized<readonly string[]>;
  /** Related animation field slug. */
  field: "2d" | "3d" | "stop-motion" | "hybrid";
  progress: { kind: "ongoing" | "upcoming" | "completed"; label: Localized };
  /** Brand visual element used as an illustrative cover, not a photo of the initiative. */
  cover: ArtworkKey;
  externalUrl: string | null;
}

export const INITIATIVES: readonly Initiative[] = [
  {
    slug: "motion-analysis-challenges",
    status: "supplied",
    source: "Society Drive: Animation Society Folder / 'تقرير مبادرة التحديات' 2024 report (paraphrased)",
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
      ],
      en: [
        "Drawing from life is the basis for understanding human and animal expression, proportion, balance, weight and pose: skills every animator needs.",
        "The initiative invites participants to explore these fundamentals through observation challenges, and shares their entries on the Society's platforms.",
        "Its aims include raising awareness of core skills for beginners and others, gauging the community's level in these skills, discovering talent in Saudi Arabia and building bridges between art disciplines.",
      ],
    },
    field: "2d",
    progress: {
      kind: "ongoing",
      label: { ar: "مستمرة، وتحدياتها القادمة مجدولة حتى ٢٠٢٧", en: "Ongoing, with upcoming challenges scheduled to 2027" },
    },
    cover: "coverRibbons",
    externalUrl: null,
  },
];
