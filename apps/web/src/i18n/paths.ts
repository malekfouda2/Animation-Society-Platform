import { LOCALES, type Locale } from "@as/contracts";

/** Swap the leading /ar or /en segment, preserving the rest of the path (equivalent page). */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/");
  if ((LOCALES as readonly string[]).includes(segments[1] ?? "")) {
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }
  return `/${target}${pathname === "/" ? "" : pathname}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}
