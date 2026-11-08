import type { ContentStatus, Localized } from "./types";

export interface NewsItem {
  slug: string;
  kind: "news" | "event";
  status: ContentStatus;
  title: Localized;
  summary: Localized;
  /** ISO date of publication (news) or of the event. */
  date: string;
  location?: Localized;
  registrationUrl?: string;
  body: Localized<readonly string[]>;
}

/** No news or events have been supplied. Never invent dated items. */
export const NEWS: readonly NewsItem[] = [];
