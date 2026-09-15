import type { MetadataRoute } from "next";
import { locales } from "@/i18n/locales";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const paths = ["", "/load"];
  return paths.flatMap((path) => {
    const languages = Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`]));
    return locales.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? (locale === "en" ? 1 : 0.8) : 0.6,
      alternates: { languages },
    }));
  });
}
