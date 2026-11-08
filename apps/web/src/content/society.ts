import type { Localized, Sourced } from "./types";

export const SOCIETY = {
  name: { ar: "جمعية الرسوم المتحركة", en: "Animation Society" } as Localized,
  website: "https://animation.org.sa/",
  /** Society mailbox for the contact form. Not yet supplied. */
  email: null as string | null,
  phone: null as string | null,
  address: null as Localized | null,
  social: [] as readonly { label: string; url: string }[],
};

export const HERO = {
  status: "supplied",
  source: "Malek, homepage brief 3 Nov 2026",
  title: { ar: "مساحة تجمع مبدعي الرسوم المتحركة", en: "A place for animation creators to connect." },
  body: {
    ar: "تعرّف على الجمعية ومجالات الرسوم المتحركة ومبادراتها، وكن جزءًا من مجتمعها الإبداعي في المملكة العربية السعودية.",
    en: "Discover the Society, the disciplines of animation and its initiatives, and become part of its creative community in Saudi Arabia.",
  },
} as const satisfies Sourced & Record<string, unknown>;

export const ABOUT = {
  status: "draft",
  source: "Developer draft from Malek's brief (aims) and Society materials",
  intro: {
    ar: "جمعية الرسوم المتحركة جمعية سعودية تدعم فن الرسوم المتحركة وصنّاعه. نعمل على تنمية المهارات، وتشجيع الإبداع، وربط المحترفين والهواة والطلاب في مجتمع واحد يتعلّم ويصنع ويشارك أعماله.",
    en: "The Animation Society is a Saudi association that supports the art of animation and the people who make it. We develop skills, encourage creativity, and connect professionals, newcomers and students in one community that learns, makes and shares work together.",
  },
  aims: {
    ar: ["دعم الرسوم المتحركة في المملكة", "تنمية المهارات", "تشجيع الإبداع", "ربط المحترفين"],
    en: ["Support animation in Saudi Arabia", "Develop skills", "Encourage creativity", "Connect professionals"],
  },
} as const;

/** Official vision and mission have not been supplied; the About page shows an honest pending state. */
export const VISION_MISSION = {
  status: "pending",
  source: "Not supplied",
  vision: null as Localized | null,
  mission: null as Localized | null,
};

export const OBJECTIVES = [
  {
    key: "growth",
    icon: "growth",
    title: { ar: "دعم نموّ الرسوم المتحركة في المملكة", en: "Supporting the growth of animation in Saudi Arabia" },
    body: {
      ar: "نوسّع حضور هذا الفن في المملكة عبر المبادرات والفعاليات والتعاون مع الجهات المعنية.",
      en: "Widening the presence of animation in the Kingdom through initiatives, events and collaboration.",
    },
  },
  {
    key: "skills",
    icon: "skills",
    title: { ar: "تطوير المهارات المهنية والتقنية", en: "Developing professional and technical skills" },
    body: {
      ar: "نقدّم فرصًا للتعلّم والتطبيق تساعد المبدعين على صقل أدواتهم في كل مرحلة من مراحل الإنتاج.",
      en: "Offering chances to learn and practise that sharpen creators' craft at every stage of production.",
    },
  },
  {
    key: "creativity",
    icon: "creativity",
    title: { ar: "تشجيع الإبداع والابتكار", en: "Encouraging creativity and innovation" },
    body: {
      ar: "نحتفي بالأفكار الجديدة والأساليب المختلفة، ونمنحها مساحة لتظهر وتُرى.",
      en: "Celebrating new ideas and different styles, and giving them room to be seen.",
    },
  },
  {
    key: "community",
    icon: "community",
    title: { ar: "بناء مجتمع مهني مترابط", en: "Building a connected professional community" },
    body: {
      ar: "نجمع المحترفين والهواة والطلاب ليتبادلوا الخبرة ويتعاونوا في أعمالهم.",
      en: "Bringing professionals, newcomers and students together to share experience and collaborate.",
    },
  },
  {
    key: "partnerships",
    icon: "partnerships",
    title: { ar: "تعزيز الشراكات والفرص محليًا ودوليًا", en: "Strengthening local and international partnerships and opportunities" },
    body: {
      ar: "نبني جسورًا مع جهات محلية ودولية تفتح أمام الأعضاء أبوابًا جديدة.",
      en: "Building bridges with local and international organisations that open new doors for members.",
    },
  },
] as const;
export const OBJECTIVES_META: Sourced = {
  status: "supplied",
  source: "Objective titles from Malek's brief; one-line descriptions are developer drafts",
};

/** Board of Directors: names, roles and portraits not supplied. Never invent people. */
export const BOARD = {
  status: "pending",
  source: "Not supplied",
  members: [] as readonly { name: Localized; role: Localized; portrait: string | null }[],
};

export const GENERAL_ASSEMBLY = {
  status: "draft",
  source: "Developer draft from the Society's membership material (Instagram highlight 'العضويات')",
  body: {
    ar: "الجمعية العمومية هي أعلى جهة في الجمعية، وتضم الأعضاء العاملين الذين يحق لهم حضور اجتماعاتها والتصويت على قراراتها والترشّح لعضوية مجلس الإدارة. ومن صلاحياتها منح العضوية الفخرية والشرفية.",
    en: "The General Assembly is the Society's highest body. It brings together working members, who may attend its meetings, vote on its decisions and stand for the Board of Directors. It also grants honorary and distinguished memberships.",
  },
  votingNote: {
    ar: "حق التصويت مرتبط بالعضوية العاملة وشروطها، ولا يُكتسب بمجرد دفع رسوم العضوية.",
    en: "Voting rights come with working membership and its conditions. Paying a membership fee does not grant them on its own.",
  },
};
