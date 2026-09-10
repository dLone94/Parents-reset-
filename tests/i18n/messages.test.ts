import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findMissingKeys, loadMessages, mergeMessages } from "@/i18n/messages";
import { locales } from "@/i18n/locales";

const dir = join(process.cwd(), "messages");
const en = JSON.parse(readFileSync(join(dir, "en.json"), "utf8"));

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "object" && v) Object.assign(out, flatten(v as Record<string, unknown>, `${prefix}${k}.`));
    else out[`${prefix}${k}`] = String(v);
  }
  return out;
}

describe("message files", () => {
  it("exist for every supported locale", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    for (const locale of locales) expect(files).toContain(locale);
  });

  it("use stable dotted keys, never English sentences as keys", () => {
    for (const key of Object.keys(flatten(en))) {
      expect(key).toMatch(/^[a-zA-Z0-9.]+$/);
      expect(key).not.toMatch(/\s/);
    }
  });

  it("have the same keys as English and keep ICU placeholders intact", () => {
    const enFlat = flatten(en);
    for (const locale of locales) {
      const data = JSON.parse(readFileSync(join(dir, `${locale}.json`), "utf8"));
      const missing = findMissingKeys(en, data);
      expect(missing, `${locale} missing keys`).toEqual([]);
      const flat = flatten(data);
      for (const [key, value] of Object.entries(enFlat)) {
        const placeholders = (value.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
        const got = (flat[key]?.match(/\{[a-zA-Z]+\}/g) ?? []).sort();
        expect(got, `${locale}:${key} placeholders`).toEqual(placeholders);
      }
      if (locale !== "en") {
        expect(data._meta?.status, `${locale} must declare review status`).toBe("unreviewed");
      }
    }
  });

  it("do not reuse English text in the German, Bulgarian, French, Chinese or Japanese hero", () => {
    for (const locale of ["de", "bg", "fr", "zh", "ja"]) {
      const data = JSON.parse(readFileSync(join(dir, `${locale}.json`), "utf8"));
      expect(data.home.hero.title).not.toBe(en.home.hero.title);
    }
  });
});

describe("English fallback", () => {
  it("fills missing keys from English without crashing", () => {
    const partial = { home: { hero: { title: "Das Leben ist viel." } }, nav: { home: "" } };
    const merged = mergeMessages(en, partial) as typeof en;
    expect(merged.home.hero.title).toBe("Das Leben ist viel.");
    expect(merged.home.hero.subtitle).toBe(en.home.hero.subtitle);
    expect(merged.nav.home).toBe(en.nav.home); // empty string falls back too
    expect(merged.reset.submit).toBe(en.reset.submit);
  });

  it("reports missing keys so they can be logged in development", () => {
    const missing = findMissingKeys(en, { home: { hero: { title: "x" } } });
    expect(missing).toContain("home.hero.subtitle");
    expect(missing).toContain("nav");
    expect(missing).not.toContain("home.hero.title");
  });

  it("loads merged messages for a locale and English for the source", async () => {
    const de = (await loadMessages("de")) as typeof en;
    expect(de.home.hero.primaryCta).not.toBe(en.home.hero.primaryCta);
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    const enLoaded = await loadMessages("en");
    expect(enLoaded).toEqual(en);
  });
});
