import type { ArtworkKey } from "@/config/artwork";
import type { Localized } from "./types";

export interface AnimationField {
  slug: "2d" | "3d" | "stop-motion" | "hybrid";
  art: ArtworkKey;
  name: Localized;
  /** Supplied one-line definition (Malek's brief). */
  summary: Localized;
  /** Developer draft, longer description for the Fields page. */
  description: Localized;
  /** Developer draft, associated creative roles. */
  roles: Localized<readonly string[]>;
}

export const FIELDS: readonly AnimationField[] = [
  {
    slug: "2d",
    art: "field2d",
    name: { ar: "الرسوم المتحركة ثنائية الأبعاد", en: "2D Animation" },
    summary: {
      ar: "تصميم الشخصيات والخلفيات، ولوحات القصة، والتحريك إطارًا بإطار.",
      en: "Character design, backgrounds, storyboarding and frame-by-frame animation.",
    },
    description: {
      ar: "أقدم أشكال الرسوم المتحركة وأقربها إلى الرسم نفسه. تُرسم كل حركة يدويًا أو رقميًا على سلسلة من الإطارات، ويصنع الإيقاع بين رسمة وأخرى إحساس الوزن والحياة.",
      en: "The oldest form of animation and the closest to drawing itself. Every movement is drawn, by hand or digitally, across a series of frames, and the timing between drawings creates weight and life.",
    },
    roles: {
      ar: ["مصمم الشخصيات", "رسّام الخلفيات", "رسّام لوحات القصة", "رسّام الحركة", "مصمم المؤثرات ثنائية الأبعاد"],
      en: ["Character designer", "Background artist", "Storyboard artist", "2D animator", "2D effects artist"],
    },
  },
  {
    slug: "3d",
    art: "field3d",
    name: { ar: "الرسوم المتحركة ثلاثية الأبعاد", en: "3D Animation" },
    summary: {
      ar: "النمذجة، والإكساء، وبناء الهياكل، والتحريك، والإضاءة، والمؤثرات.",
      en: "Modeling, texturing, rigging, animation, lighting and effects.",
    },
    description: {
      ar: "تُبنى الشخصيات والعوالم مجسّمةً داخل الحاسوب، ثم تُكسى وتُجهّز بهياكل للتحريك، وتُضاء وتُصوَّر بكاميرا افتراضية. يتوزع العمل على فريق تتكامل تخصصاته.",
      en: "Characters and worlds are built as 3D models, textured, rigged for movement, then lit and filmed with a virtual camera. The work is shared by a team of complementary specialists.",
    },
    roles: {
      ar: ["فنان النمذجة", "فنان الإكساء", "فنان بناء الهياكل", "رسّام الحركة ثلاثي الأبعاد", "فنان الإضاءة", "فنان المؤثرات البصرية"],
      en: ["Modeler", "Texture artist", "Rigger", "3D animator", "Lighting artist", "Effects artist"],
    },
  },
  {
    slug: "stop-motion",
    art: "fieldStopMotion",
    name: { ar: "إيقاف الحركة", en: "Stop Motion" },
    summary: {
      ar: "الدمى والصلصال والقصاصات والمجسّمات الحقيقية، تُصوَّر إطارًا بإطار.",
      en: "Puppets, clay, cut-outs and physical objects photographed frame by frame.",
    },
    description: {
      ar: "فنّ صبور يجمع بين الحِرفة والتصوير. تُحرَّك الدمى والمجسّمات حركة صغيرة بين كل لقطة وأخرى، فتبدو حيّة حين تُعرض اللقطات متتابعة.",
      en: "A patient craft that joins making with photography. Puppets and objects move a tiny step between each photo, and come alive when the frames play in sequence.",
    },
    roles: {
      ar: ["صانع الدمى", "مصمم الديكور", "رسّام الحركة بالإيقاف", "مدير التصوير", "مهندس الهياكل الداخلية"],
      en: ["Puppet maker", "Set designer", "Stop-motion animator", "Director of photography", "Armature builder"],
    },
  },
  {
    slug: "hybrid",
    art: "fieldHybrid",
    name: { ar: "الرسوم المتحركة الهجينة", en: "Hybrid Animation" },
    summary: {
      ar: "دمج عناصر ثنائية وثلاثية الأبعاد في عمل واحد.",
      en: "Combining 2D and 3D elements in one production.",
    },
    description: {
      ar: "يأخذ من كل تقنية أفضل ما فيها: خطوط مرسومة فوق مشاهد مجسّمة، أو شخصيات ثلاثية الأبعاد بمظهر مرسوم يدويًا. يحتاج إلى فريق يفهم أكثر من لغة بصرية.",
      en: "Takes the best of each technique: drawn lines over 3D scenes, or 3D characters with a hand-drawn look. It needs a team fluent in more than one visual language.",
    },
    roles: {
      ar: ["مشرف الأسلوب البصري", "فنان الدمج", "رسّام الحركة", "فنان المؤثرات", "مطوّر الأدوات التقنية"],
      en: ["Look-development lead", "Compositor", "Animator", "Effects artist", "Technical artist"],
    },
  },
];

export const FIELDS_META = {
  status: "supplied",
  source: "Summaries from Malek's brief; descriptions and roles are developer drafts",
} as const;
