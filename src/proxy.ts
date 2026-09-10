import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale-aware routing.
 * - First visit: pick the closest supported locale from Accept-Language.
 * - Manual choice: persisted in the NEXT_LOCALE cookie and honoured afterwards.
 * - Unsupported locales fall back to English.
 */
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, static files and API routes.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
