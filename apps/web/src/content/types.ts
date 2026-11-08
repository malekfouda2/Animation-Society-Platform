import type { Locale } from "@as/contracts";

/**
 * Editorial content model. Interim source of truth until Stage 2 moves editable content into the API/CMS.
 * Every item carries a status so pages can label it honestly:
 * - supplied: provided by Malek or found in Society materials, awaiting formal sign-off
 * - draft: written by the developer from context, needs Society review
 * - pending: the Society has not supplied this yet; pages render an honest empty state
 */
export type ContentStatus = "supplied" | "draft" | "pending";

export type Localized<T = string> = Readonly<Record<Locale, T>>;

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

export interface Sourced {
  status: ContentStatus;
  /** Where the content came from (kept for the content checklist, not rendered). */
  source: string;
}
