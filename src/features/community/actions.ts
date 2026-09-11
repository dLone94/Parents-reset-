"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ensureProfile } from "@/features/account/actions";
import { isLocale } from "@/i18n/locales";
import { redirect } from "@/i18n/navigation";
import { moderateText } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { communityLimits, newCommentSchema, newPostSchema, reportSchema } from "./schema";

export type PostFormState =
  | { status: "idle" }
  | { status: "error"; code: "invalid" | "titleTooLong" | "bodyTooLong" | "rejected" | "rateLimited" | "signIn" | "generic" };

export type CommentFormState =
  | { status: "idle" }
  | { status: "posted" }
  | { status: "error"; code: "invalid" | "tooLong" | "rejected" | "rateLimited" | "signIn" | "generic" };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
}

export async function createPost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "generic" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", code: "signIn" };

  const limited = rateLimit(`post:${auth.user.id}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limited.ok) return { status: "error", code: "rateLimited" };

  const parsed = newPostSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.message === "tooLong") return { status: "error", code: issue.path[0] === "title" ? "titleTooLong" : "bodyTooLong" };
    return { status: "error", code: "invalid" };
  }
  const title = moderateText(parsed.data.title, { maxLength: communityLimits.titleMax });
  const body = moderateText(parsed.data.body, { maxLength: communityLimits.bodyMax });
  if (!title.ok || !body.ok) return { status: "error", code: "rejected" };

  const profile = await ensureProfile();
  const locale = String(formData.get("locale") ?? "en");
  const safeLocale = isLocale(locale) ? locale : "en";

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      author_id: auth.user.id,
      display_name: profile?.displayName ?? "Parent",
      category: parsed.data.category,
      locale: safeLocale,
      title: parsed.data.title,
      body: parsed.data.body,
    })
    .select("id")
    .single();
  if (error || !data) return { status: "error", code: "generic" };

  revalidatePath(`/${safeLocale}/community`);
  redirect({ href: `/community/${data.id}`, locale: safeLocale });
  return { status: "idle" };
}

export async function createComment(_prev: CommentFormState, formData: FormData): Promise<CommentFormState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", code: "generic" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", code: "signIn" };

  const limited = rateLimit(`comment:${auth.user.id}`, { limit: 20, windowMs: 10 * 60_000 });
  if (!limited.ok) return { status: "error", code: "rateLimited" };

  const parsed = newCommentSchema.safeParse({ postId: formData.get("postId"), body: formData.get("body") });
  if (!parsed.success) {
    return { status: "error", code: parsed.error.issues[0]?.message === "tooLong" ? "tooLong" : "invalid" };
  }
  const check = moderateText(parsed.data.body, { maxLength: communityLimits.commentMax });
  if (!check.ok) return { status: "error", code: "rejected" };

  const profile = await ensureProfile();
  const locale = String(formData.get("locale") ?? "en");
  const safeLocale = isLocale(locale) ? locale : "en";

  const { error } = await supabase.from("community_comments").insert({
    post_id: parsed.data.postId,
    author_id: auth.user.id,
    display_name: profile?.displayName ?? "Parent",
    locale: safeLocale,
    body: parsed.data.body,
  });
  if (error) return { status: "error", code: "generic" };

  revalidatePath(`/${safeLocale}/community/${parsed.data.postId}`);
  revalidatePath(`/${safeLocale}/community`);
  return { status: "posted" };
}

export async function toggleSupport(postId: string, locale: string): Promise<{ supported: boolean } | { error: "signIn" | "generic" }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "generic" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "signIn" };
  const limited = rateLimit(`support:${auth.user.id}:${await clientIp()}`, { limit: 60, windowMs: 60_000 });
  if (!limited.ok) return { error: "generic" };

  const { data: existing } = await supabase
    .from("community_supports")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const result = existing
    ? await supabase.from("community_supports").delete().eq("post_id", postId).eq("user_id", auth.user.id)
    : await supabase.from("community_supports").insert({ post_id: postId, user_id: auth.user.id });
  if (result.error) return { error: "generic" };

  const safeLocale = isLocale(locale) ? locale : "en";
  revalidatePath(`/${safeLocale}/community`);
  revalidatePath(`/${safeLocale}/community/${postId}`);
  return { supported: !existing };
}

export async function reportContent(input: { postId?: string; commentId?: string; reason: string }): Promise<{ ok: boolean }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false };
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success || (!parsed.data.postId && !parsed.data.commentId)) return { ok: false };
  const { error } = await supabase.from("community_reports").insert({
    post_id: parsed.data.postId ?? null,
    comment_id: parsed.data.commentId ?? null,
    reporter_id: auth.user.id,
    reason: parsed.data.reason,
  });
  return { ok: !error };
}

export async function deleteOwnPost(postId: string, locale: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("community_posts").delete().eq("id", postId).eq("author_id", auth.user.id);
  const safeLocale = isLocale(locale) ? locale : "en";
  revalidatePath(`/${safeLocale}/community`);
  redirect({ href: "/community", locale: safeLocale });
}
