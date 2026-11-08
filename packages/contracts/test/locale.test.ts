import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_DIRECTION, LOCALES, isLocale } from "../src/locale.js";

describe("locale contract", () => {
  it("supports exactly Arabic and English", () => {
    expect(LOCALES).toEqual(["ar", "en"]);
    expect(isLocale(DEFAULT_LOCALE)).toBe(true);
  });

  it("maps direction per locale", () => {
    expect(LOCALE_DIRECTION.ar).toBe("rtl");
    expect(LOCALE_DIRECTION.en).toBe("ltr");
  });

  it("rejects unknown values", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale("AR")).toBe(false);
  });
});
