import { describe, expect, it } from "vitest";
import { matchAcceptLanguage, normaliseLocale, resolveLocale } from "@/i18n/detect";
import { defaultLocale, isLocale, localeNames, locales } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { formatCurrency, formatDate, formatNumber } from "@/lib/intl/format";

describe("supported locales", () => {
  it("covers all EU official languages plus English, Chinese and Japanese", () => {
    const expected = [
      "bg", "hr", "cs", "da", "nl", "en", "et", "fi", "fr", "de", "el", "hu", "ga", "it", "lv", "lt",
      "mt", "pl", "pt", "ro", "sk", "sl", "es", "sv", "zh", "ja",
    ];
    expect([...locales].sort()).toEqual(expected.sort());
    expect(locales).toHaveLength(26);
  });

  it("has a native name for every locale and English as default", () => {
    for (const locale of locales) expect(localeNames[locale].length).toBeGreaterThan(0);
    expect(defaultLocale).toBe("en");
    expect(localeNames.bg).toBe("Български");
    expect(localeNames.ja).toBe("日本語");
  });

  it("routes every locale with a prefix and persists the choice in a cookie", () => {
    expect(routing.locales).toEqual(locales);
    expect(routing.localePrefix).toBe("always");
    expect(routing.localeDetection).toBe(true);
    expect(routing.localeCookie).toMatchObject({ name: "NEXT_LOCALE" });
  });
});

describe("locale detection", () => {
  it("picks the closest supported locale from Accept-Language", () => {
    expect(matchAcceptLanguage("de-AT,de;q=0.9,en;q=0.8")).toBe("de");
    expect(matchAcceptLanguage("zh-CN,zh;q=0.9")).toBe("zh");
    expect(matchAcceptLanguage("pt-BR")).toBe("pt");
    expect(matchAcceptLanguage("fr-CA;q=0.5, bg;q=0.9")).toBe("bg");
    expect(matchAcceptLanguage("*")).toBeNull();
  });

  it("falls back to English for unsupported locales", () => {
    expect(matchAcceptLanguage("tr-TR,ar;q=0.8")).toBeNull();
    expect(resolveLocale({ acceptLanguage: "tr-TR" })).toBe("en");
    expect(resolveLocale({})).toBe("en");
    expect(normaliseLocale("xx")).toBe("en");
    expect(normaliseLocale("JA-jp")).toBe("ja");
  });

  it("prefers a manual choice (cookie) over browser detection", () => {
    expect(resolveLocale({ cookieLocale: "ro", acceptLanguage: "de-DE" })).toBe("ro");
    expect(resolveLocale({ cookieLocale: "nope", acceptLanguage: "de-DE" })).toBe("de");
  });

  it("type guards locale strings", () => {
    expect(isLocale("mt")).toBe(true);
    expect(isLocale("en-US")).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("Intl formatting", () => {
  const date = new Date(Date.UTC(2026, 2, 5, 12, 0, 0));

  it("formats dates per locale", () => {
    expect(formatDate(date, "en", { dateStyle: "long", timeZone: "UTC" })).toBe("March 5, 2026");
    expect(formatDate(date, "de", { dateStyle: "long", timeZone: "UTC" })).toBe("5. März 2026");
    expect(formatDate(date, "bg", { dateStyle: "long", timeZone: "UTC" })).toMatch(/5 март 2026/);
    expect(formatDate(date, "ja", { dateStyle: "long", timeZone: "UTC" })).toBe("2026年3月5日");
    expect(formatDate(date.toISOString(), "fr", { dateStyle: "long", timeZone: "UTC" })).toBe("5 mars 2026");
  });

  it("formats numbers and currency per locale without assuming EUR", () => {
    expect(formatNumber(1234567.89, "en")).toBe("1,234,567.89");
    expect(formatNumber(1234567.89, "de")).toBe("1.234.567,89");
    expect(formatNumber(1234567.89, "fr").replace(/ | /g, " ")).toBe("1 234 567,89");
    expect(formatCurrency(12.5, "de", "EUR").replace(/ /g, " ")).toBe("12,50 €");
    expect(formatCurrency(12.5, "en", "GBP")).toBe("£12.50");
    expect(formatCurrency(1250, "ja", "JPY")).toMatch(/1,250/);
    expect(formatCurrency(12.5, "ro", "RON")).toMatch(/12,50/);
  });
});
