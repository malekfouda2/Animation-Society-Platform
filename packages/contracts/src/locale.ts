export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Arabic is the Society's primary language; English is the secondary locale. */
export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_DIRECTION: Readonly<Record<Locale, "rtl" | "ltr">> = {
  ar: "rtl",
  en: "ltr",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
