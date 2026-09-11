import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/supabase/session";

const handleI18n = createMiddleware(routing);

/**
 * Locale-aware routing plus Supabase session refresh.
 * - First visit: pick the closest supported locale from Accept-Language.
 * - Manual choice: persisted in the NEXT_LOCALE cookie and honoured afterwards.
 * - Unsupported locales fall back to English.
 * - Signed-in users get their auth cookies refreshed on every navigation.
 */
export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);
  return refreshSession(request, response);
}

export const config = {
  // Skip Next internals, static files and API routes.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
