import { describe, expect, it } from "vitest";
import { ar } from "../src/i18n/dictionaries/ar";
import { en } from "../src/i18n/dictionaries/en";
import { otherLocale, switchLocalePath } from "../src/i18n/paths";
import { negotiateLocale } from "../src/proxy";

describe("negotiateLocale", () => {
  it("defaults to Arabic without a header or supported language", () => {
    expect(negotiateLocale(null)).toBe("ar");
    expect(negotiateLocale("fr-FR,de;q=0.8")).toBe("ar");
  });

  it("honors q-weights and region subtags", () => {
    expect(negotiateLocale("en-US,en;q=0.9")).toBe("en");
    expect(negotiateLocale("fr;q=1, en;q=0.4, ar-SA;q=0.7")).toBe("ar");
    expect(negotiateLocale("ar;q=0, en;q=0.1")).toBe("en");
  });

  it("tolerates malformed weights", () => {
    expect(negotiateLocale("en;q=abc, ar;q=0.5")).toBe("ar");
  });
});

describe("switchLocalePath", () => {
  it("swaps only the leading locale segment", () => {
    expect(switchLocalePath("/ar", "en")).toBe("/en");
    expect(switchLocalePath("/ar/news", "en")).toBe("/en/news");
    expect(switchLocalePath("/en/admin", "ar")).toBe("/ar/admin");
    expect(switchLocalePath("/en/news/ar-story", "ar")).toBe("/ar/news/ar-story");
  });

  it("prefixes unlocalized paths", () => {
    expect(switchLocalePath("/", "en")).toBe("/en");
    expect(switchLocalePath("/about", "ar")).toBe("/ar/about");
  });

  it("toggles locales", () => {
    expect(otherLocale("ar")).toBe("en");
    expect(otherLocale("en")).toBe("ar");
  });
});

describe("dictionaries", () => {
  // Types already enforce identical key sets; this catches empty strings left during drafting.
  const leaves = (obj: object): string[] =>
    Object.values(obj).flatMap((v: unknown) => (typeof v === "string" ? [v] : leaves(v as object)));

  it("have no empty translations", () => {
    for (const dict of [ar, en]) {
      expect(leaves(dict).every((s) => s.trim().length > 0)).toBe(true);
    }
  });
});
