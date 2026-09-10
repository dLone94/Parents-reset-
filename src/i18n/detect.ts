import { defaultLocale, isLocale, locales, type Locale } from "./locales";

/**
 * Pure locale resolution used for tests and for any place outside the proxy
 * that needs the same behaviour (e.g. API routes later).
 *
 * Priority:
 * 1. A locale the user chose manually (cookie)
 * 2. The closest supported locale from Accept-Language
 * 3. The default locale
 */
export function resolveLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (input.cookieLocale && isLocale(input.cookieLocale)) {
    return input.cookieLocale;
  }
  const fromHeader = matchAcceptLanguage(input.acceptLanguage ?? "");
  return fromHeader ?? defaultLocale;
}

/**
 * Parses an Accept-Language header and returns the best supported locale.
 * "de-AT,de;q=0.9,en;q=0.8" -> "de"; "zh-CN" -> "zh"; "pt-BR" -> "pt".
 */
export function matchAcceptLanguage(header: string): Locale | null {
  const ranges = header
    .split(",")
    .map((part, index) => {
      const [tagRaw, ...params] = part.trim().split(";");
      const tag = tagRaw.trim().toLowerCase();
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag, q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter((r) => r.tag.length > 0 && r.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const range of ranges) {
    if (range.tag === "*") continue;
    const language = range.tag.split("-")[0];
    if (isLocale(range.tag)) return range.tag;
    if (isLocale(language)) return language;
  }
  return null;
}

export function normaliseLocale(value: string | undefined | null): Locale {
  if (!value) return defaultLocale;
  const lower = value.toLowerCase();
  if (isLocale(lower)) return lower;
  const language = lower.split("-")[0];
  return isLocale(language) ? language : defaultLocale;
}

export const supportedLocales = locales;
