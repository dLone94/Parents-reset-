import type { Metadata } from "next";
import { locales } from "@/i18n/locales";

/**
 * Public site URL for canonical links, hreflang and the sitemap.
 * Order: explicit NEXT_PUBLIC_SITE_URL, then the address Vercel assigns to
 * the deployment (production domain first, then the preview URL), then
 * localhost for development.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:3000";
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
