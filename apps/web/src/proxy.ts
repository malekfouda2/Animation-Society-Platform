import { DEFAULT_LOCALE, LOCALES, type Locale } from "@as/contracts";
import { NextResponse, type NextRequest } from "next/server";

/** Picks the best supported locale from Accept-Language (q-weighted), else the default. */
export function negotiateLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { lang: tag.toLowerCase().split("-")[0] ?? "", weight: Number.isFinite(weight) ? weight : 0 };
    })
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  for (const { lang } of ranked) {
    if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale;
  }
  return DEFAULT_LOCALE;
}

// Redirects unprefixed paths to /ar or /en. Business logic and auth decisions do NOT live here.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${negotiateLocale(request.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API, Next internals and files with an extension (static assets, robots.txt, etc.).
  matcher: ["/((?!api/|_next/|.*\\.[\\w]+$).*)"],
};
