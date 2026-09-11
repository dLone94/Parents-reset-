import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "./env";

/**
 * Refreshes the Supabase session cookies on every request that passes through
 * the proxy. Called after next-intl has produced its response so refreshed
 * cookies ride along with the locale redirect or rewrite.
 */
export async function refreshSession(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const env = getSupabasePublicEnv();
  if (!env) return response;
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  // Touching getUser() validates the token and rotates it when needed.
  await supabase.auth.getUser();
  return response;
}
