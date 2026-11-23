import type { Localized } from "./types";

export const SOCIETY = {
  name: { ar: "جمعية الرسوم المتحركة", en: "Animation Society" } as Localized,
  website: "https://animation.org.sa/",
  /** Society mailbox, from the 2026 profile's closing slide. */
  email: "info@animation.org.sa" as string | null,
  /** The Society's link page, from the same slide. */
  links: "https://linktr.ee/animksa",
  /**
   * Official registration line, as printed on every slide of the 2026 profile and on the letterhead.
   * English is a developer translation (D08).
   */
  registration: {
    ar: "جمعية الرسوم المتحركة | رقم التسجيل 2189 | رقم القرار 74915 | تاريخ القرار 1443/04/10هـ | منطقة الرياض",
    en: "Animation Society | Registration no. 2189 | Decision no. 74915 | Decision date 10/04/1443 AH | Riyadh Region",
  } as Localized,
  phone: null as string | null,
  address: null as Localized | null,
  social: [] as readonly { label: string; url: string }[],
};

// The hero, About, vision, goals, board and General Assembly texts are page sections edited in the
// staff area (seeded from this file's earlier contents by `npm run content -w @as/api -- seed`).
