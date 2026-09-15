import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase redirects here after an email confirmation or magic link. We turn
 * the one-time code into a session cookie and send the user to their account
 * page in the locale they came from.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const localeParam = url.searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}/account`;

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(new URL(`/${locale}/account?error=link`, url.origin));
      }
    }
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
