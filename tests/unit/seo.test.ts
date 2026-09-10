import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAlternates, getSiteUrl } from "@/lib/seo";

afterEach(() => vi.unstubAllEnvs());

describe("getSiteUrl", () => {
  it("prefers the explicit public URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://parentreset.app/");
    vi.stubEnv("VERCEL_URL", "preview.vercel.app");
    expect(getSiteUrl()).toBe("https://parentreset.app");
  });

  it("falls back to the Vercel production domain, then the preview URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "parents-reset.vercel.app");
    vi.stubEnv("VERCEL_URL", "parents-reset-abc123.vercel.app");
    expect(getSiteUrl()).toBe("https://parents-reset.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(getSiteUrl()).toBe("https://parents-reset-abc123.vercel.app");
  });

  it("uses localhost in development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("buildAlternates", () => {
  it("gives every locale its own canonical and an English x-default", () => {
    const alt = buildAlternates("de", "/reset");
    expect(alt.canonical).toBe("/de/reset");
    const languages = alt.languages as Record<string, string>;
    expect(languages.ja).toBe("/ja/reset");
    expect(languages["x-default"]).toBe("/en/reset");
    expect(Object.keys(languages)).toHaveLength(27);
    expect(buildAlternates("en", "/").canonical).toBe("/en");
  });
});
