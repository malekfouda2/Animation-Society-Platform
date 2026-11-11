import type { Localized } from "./types";

export const SOCIETY = {
  name: { ar: "جمعية الرسوم المتحركة", en: "Animation Society" } as Localized,
  website: "https://animation.org.sa/",
  /** Society mailbox for the contact form. Not yet supplied. */
  email: null as string | null,
  phone: null as string | null,
  address: null as Localized | null,
  social: [] as readonly { label: string; url: string }[],
};

// The hero, About, vision, goals, board and General Assembly texts are page sections edited in the
// staff area (seeded from this file's earlier contents by `npm run content -w @as/api -- seed`).
