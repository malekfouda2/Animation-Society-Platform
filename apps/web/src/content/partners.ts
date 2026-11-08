import type { Localized } from "./types";

export interface Partner {
  name: Localized;
  logo: string;
  url: string;
}

/** No approved partners supplied. Discounts/redemption are future features and never shown. */
export const PARTNERS: readonly Partner[] = [];
