/**
 * Supported locales for Parent Reset.
 *
 * All official EU languages plus English, Chinese and Japanese.
 * Codes are standard BCP-47 language subtags. If Chinese variants are
 * needed later (zh-CN / zh-TW) they can be added here without changing
 * the rest of the i18n architecture.
 */
export const locales = [
  "en",
  "bg",
  "hr",
  "cs",
  "da",
  "nl",
  "et",
  "fi",
  "fr",
  "de",
  "el",
  "hu",
  "ga",
  "it",
  "lv",
  "lt",
  "mt",
  "pl",
  "pt",
  "ro",
  "sk",
  "sl",
  "es",
  "sv",
  "zh",
  "ja",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * Native language names, shown in the language switcher.
 * We intentionally do not rely on flags: a flag is a country, not a language.
 */
export const localeNames: Record<Locale, string> = {
  en: "English",
  bg: "Български",
  hr: "Hrvatski",
  cs: "Čeština",
  da: "Dansk",
  nl: "Nederlands",
  et: "Eesti",
  fi: "Suomi",
  fr: "Français",
  de: "Deutsch",
  el: "Ελληνικά",
  hu: "Magyar",
  ga: "Gaeilge",
  it: "Italiano",
  lv: "Latviešu",
  lt: "Lietuvių",
  mt: "Malti",
  pl: "Polski",
  pt: "Português",
  ro: "Română",
  sk: "Slovenčina",
  sl: "Slovenščina",
  es: "Español",
  sv: "Svenska",
  zh: "中文",
  ja: "日本語",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Locales that use CJK scripts and therefore need different font fallbacks and
 * no assumptions about spaces between words.
 */
export const cjkLocales: readonly Locale[] = ["zh", "ja"];
