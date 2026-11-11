import type { PolicyKey } from "@as/contracts";
import type { Localized } from "./types";

/** Policy page titles (fixed). The texts are page sections staff publish (Society-supplied wording only). */
export const POLICY_TITLES: Readonly<Record<PolicyKey, Localized>> = {
  terms: { ar: "شروط الاستخدام", en: "Terms of use" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  membership: { ar: "سياسة العضوية", en: "Membership policy" },
  "payment-refund": { ar: "سياسة الدفع والاسترداد", en: "Payment and refund policy" },
  "card-use": { ar: "سياسة استخدام بطاقة العضوية", en: "Membership card use policy" },
};
