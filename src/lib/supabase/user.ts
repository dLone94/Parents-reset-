import { cache } from "react";
import { createSupabaseServerClient } from "./server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * The signed-in user for the current request, or null for guests and for
 * deployments without Supabase. Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});
