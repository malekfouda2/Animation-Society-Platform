import { LOCALES, type Locale } from "@as/contracts";
import type { Metadata } from "next";

/** Title, description, canonical and hreflang alternates for a localized page path (e.g. "/about"). */
export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])),
    },
  };
}
