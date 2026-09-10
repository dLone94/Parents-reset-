import { defineRouting } from "next-intl/routing";
import { defaultLocale, locales } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every locale, including English, lives under its own prefix (/en, /de, ...).
  // This keeps canonical URLs and hreflang unambiguous.
  localePrefix: "always",
  // Detect from cookie first, then Accept-Language. A manual choice is stored in
  // the cookie by the proxy so it wins over browser detection on later visits.
  localeDetection: true,
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
  alternateLinks: true,
});
