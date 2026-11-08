import type { Localized } from "./types";

export interface PolicySlot {
  slug: "terms" | "privacy" | "membership" | "payment-refund" | "card-use";
  title: Localized;
  /** Society-supplied text only. null until supplied; never write legal wording. */
  text: Localized<readonly string[]> | null;
}

export const POLICIES: readonly PolicySlot[] = [
  { slug: "terms", title: { ar: "شروط الاستخدام", en: "Terms of use" }, text: null },
  { slug: "privacy", title: { ar: "سياسة الخصوصية", en: "Privacy policy" }, text: null },
  { slug: "membership", title: { ar: "سياسة العضوية", en: "Membership policy" }, text: null },
  { slug: "payment-refund", title: { ar: "سياسة الدفع والاسترداد", en: "Payment and refund policy" }, text: null },
  { slug: "card-use", title: { ar: "سياسة استخدام بطاقة العضوية", en: "Membership card use policy" }, text: null },
];
