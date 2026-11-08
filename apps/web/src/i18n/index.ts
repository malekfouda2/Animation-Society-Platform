import "server-only";
import type { Locale } from "@as/contracts";
import { ar } from "./dictionaries/ar";
import { en } from "./dictionaries/en";
import type { Dictionary } from "./types";

const dictionaries: Readonly<Record<Locale, Dictionary>> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
