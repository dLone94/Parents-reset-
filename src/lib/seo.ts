import type { Metadata } from "next";
import { locales } from "@/i18n/locales";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/**
 * Canonical + hreflang for a page path ("/" or "/reset"). Every locale gets
 * its own canonical URL; x-default points to English.
 */
export function buildAlternates(locale: string, path: string): NonNullable<Metadata["alternates"]> {
  const clean = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const code of locales) languages[code] = `/${code}${clean}`;
  languages["x-default"] = `/en${clean}`;
  return {
    canonical: `/${locale}${clean}`,
    languages,
  };
}
