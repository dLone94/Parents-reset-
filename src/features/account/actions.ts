"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { isLocale } from "@/i18n/locales";
import { redirect } from "@/i18n/navigation";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/seo";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { credentialsSchema, displayNameSchema } from "./schema";
import { generatePseudonym } from "./pseudonym";

export type AuthState =
  | { status: "idle" }
  | { status: "error"; code: "invalid" | "credentials" | "exists" | "rateLimited" | "unavailable" | "generic" }
  | { status: "checkEmail" };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
}

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "unavailable" };
  const limited = rateLimit(`auth:${await clientIp()}`, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) return { status: "error", code: "rateLimited" };

  const parsed = readCredentials(formData);
  if (!parsed.success) return { status: "error", code: "invalid" };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", code: "credentials" };

  const locale = String(formData.get("locale") ?? "en");
  const next = String(formData.get("next") ?? "");
  redirect({ href: safeNext(next) ?? "/account", locale: isLocale(locale) ? locale : "en" });
  return { status: "idle" };
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "unavailable" };
  const limited = rateLimit(`auth:${await clientIp()}`, { limit: 10, windowMs: 60_000 });
  if (!limited.ok) return { status: "error", code: "rateLimited" };

  const parsed = readCredentials(formData);
  if (!parsed.success) return { status: "error", code: "invalid" };
  const locale = String(formData.get("locale") ?? "en");
  const safeLocale = isLocale(locale) ? locale : "en";

  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${getSiteUrl()}/api/auth/callback?locale=${safeLocale}`,
      data: { locale: safeLocale, display_name: generatePseudonym() },
    },
  });
  if (error) {
    return { status: "error", code: /already|exists|registered/i.test(error.message) ? "exists" : "generic" };
  }
  // Confirmation required: no session yet.
  if (!data.session) return { status: "checkEmail" };

  redirect({ href: "/account", locale: safeLocale });
  return { status: "idle" };
}

export async function signOut(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  const locale = String(formData.get("locale") ?? "en");
  redirect({ href: "/", locale: isLocale(locale) ? locale : "en" });
}

export interface ProfileSummary {
  displayName: string;
  locale: string;
}

/** Reads the profile, creating a display name on first use. */
export async function ensureProfile(): Promise<ProfileSummary | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("display_name, locale")
    .eq("id", auth.user.id)
    .maybeSingle();

  let displayName: string | null = data?.display_name ?? null;
  if (!displayName) {
    displayName = (auth.user.user_metadata?.display_name as string | undefined) ?? generatePseudonym();
    await supabase
      .from("profiles")
      .upsert({ id: auth.user.id, display_name: displayName, locale: data?.locale ?? "en" });
  }
  return { displayName, locale: data?.locale ?? "en" };
}

export type ProfileState = { status: "idle" } | { status: "saved"; displayName: string } | { status: "error"; code: "invalid" | "generic" };

export async function updateDisplayName(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "generic" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", code: "generic" };

  const raw = formData.get("displayName");
  const parsed = displayNameSchema.safeParse(raw === "" || raw === null ? generatePseudonym() : raw);
  if (!parsed.success) return { status: "error", code: "invalid" };

  const { error } = await supabase.from("profiles").update({ display_name: parsed.data }).eq("id", auth.user.id);
  if (error) return { status: "error", code: "generic" };
  return { status: "saved", displayName: parsed.data };
}

/** Remembers the user's language on the profile when they switch it. */
export async function updateProfileLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("profiles").update({ locale }).eq("id", auth.user.id);
}

export type DangerState = { status: "idle" } | { status: "done" } | { status: "error" };

/** Deletes every reset and load item of the signed-in user. */
export async function deleteHistory(): Promise<DangerState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error" };
  const a = await supabase.from("resets").delete().eq("user_id", auth.user.id);
  const b = await supabase.from("load_items").delete().eq("user_id", auth.user.id);
  return a.error || b.error ? { status: "error" } : { status: "done" };
}

/**
 * Deletes the account. Personal rows are removed first under the user's own
 * RLS. The auth user itself can only be removed with the service role key;
 * when that key is not configured the data is gone and the user is signed
 * out, and the auth record can be deleted from the Supabase dashboard.
 */
export async function deleteAccount(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const locale = String(formData.get("locale") ?? "en");
  const safeLocale = isLocale(locale) ? locale : "en";
  if (!supabase) redirect({ href: "/", locale: safeLocale });
  const { data: auth } = await supabase!.auth.getUser();
  if (!auth.user) redirect({ href: "/", locale: safeLocale });
  const userId = auth.user!.id;

  await supabase!.from("resets").delete().eq("user_id", userId);
  await supabase!.from("load_items").delete().eq("user_id", userId);
  await supabase!.from("community_supports").delete().eq("user_id", userId);
  await supabase!.from("community_comments").delete().eq("author_id", userId);
  await supabase!.from("community_posts").delete().eq("author_id", userId);
  await supabase!.from("profiles").delete().eq("id", userId);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const env = getSupabasePublicEnv();
  if (serviceKey && env) {
    const admin = createClient(env.url, serviceKey, { auth: { persistSession: false } });
    await admin.auth.admin.deleteUser(userId);
  }
  await supabase!.auth.signOut();
  redirect({ href: "/?deleted=1", locale: safeLocale });
}

function safeNext(next: string): string | null {
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  // Strip a leading locale segment: navigation adds it back.
  const stripped = next.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return stripped || "/";
}
