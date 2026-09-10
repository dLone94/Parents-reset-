import type { AbstractIntlMessages } from "next-intl";
import { defaultLocale, type Locale } from "./locales";

/**
 * Deep-merges locale messages over the English source so that any key missing
 * in a translation falls back to English instead of crashing or rendering a
 * raw key. Translation files may therefore be partial while being reviewed.
 */
export function mergeMessages(
  base: AbstractIntlMessages,
  overrides: AbstractIntlMessages | undefined,
): AbstractIntlMessages {
  if (!overrides) return base;
  const result: AbstractIntlMessages = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const baseValue = result[key];
    if (isRecord(value) && isRecord(baseValue)) {
      result[key] = mergeMessages(baseValue, value);
    } else if (typeof value === "string" && value.trim().length > 0) {
      result[key] = value;
    } else if (value !== undefined && typeof value !== "string") {
      result[key] = value;
    }
  }
  return result;
}

function isRecord(value: unknown): value is AbstractIntlMessages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Loads the raw messages for a locale. English is always loaded as the base.
 */
export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  const base = (await import(`../../messages/${defaultLocale}.json`))
    .default as AbstractIntlMessages;
  if (locale === defaultLocale) return base;
  try {
    const override = (await import(`../../messages/${locale}.json`))
      .default as AbstractIntlMessages;
    return mergeMessages(base, override);
  } catch {
    return base;
  }
}

/**
 * Returns a list of dotted keys present in `base` but missing in `candidate`.
 * Used by tests and by the translation status script.
 */
export function findMissingKeys(
  base: AbstractIntlMessages,
  candidate: AbstractIntlMessages,
  prefix = "",
): string[] {
  const missing: string[] = [];
  for (const [key, value] of Object.entries(base)) {
    if (key.startsWith("_")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const other = candidate[key];
    if (isRecord(value)) {
      if (!isRecord(other)) missing.push(path);
      else missing.push(...findMissingKeys(value, other, path));
    } else if (typeof other !== "string" || other.trim().length === 0) {
      missing.push(path);
    }
  }
  return missing;
}
