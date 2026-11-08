import { LOCALES, isLocale, type Locale } from "@as/contracts";
import { notFound } from "next/navigation";

export function generateLocaleParams(): { locale: Locale }[] {
  return LOCALES.map((locale) => ({ locale }));
}

/** Resolves the [locale] route param or renders 404 for unsupported values. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
