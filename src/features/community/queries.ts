import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isCommunityCategory, type CommunityCategory } from "./schema";
import type { CommunityComment, CommunityPost } from "./types";

interface PostRow {
  id: string;
  author_id: string;
  display_name: string;
  category: string;
  locale: string;
  title: string;
  body: string;
  created_at: string;
  comment_count: number | string | null;
  support_count: number | string | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  display_name: string;
  body: string;
  created_at: string;
}

export const POSTS_PAGE_SIZE = 30;

/** Lists visible posts, newest first. Returns null when Supabase is not configured. */
export async function listPosts(category?: CommunityCategory): Promise<CommunityPost[] | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  let query = supabase
    .from("community_posts_with_counts")
    .select("*")
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(POSTS_PAGE_SIZE);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as PostRow[];
  const supported = await supportedIds(supabase, rows.map((r) => r.id));
  return rows.map((row) => rowToPost(row, supported.has(row.id)));
}

export async function getPost(id: string): Promise<CommunityPost | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("community_posts_with_counts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const supported = await supportedIds(supabase, [id]);
  return rowToPost(data as PostRow, supported.has(id));
}

export async function listComments(postId: string): Promise<CommunityComment[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("community_comments")
    .select("id, post_id, author_id, display_name, body, created_at")
    .eq("post_id", postId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CommentRow[]).map((row) => ({
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    displayName: row.display_name,
    body: row.body,
    createdAt: row.created_at,
  }));
}

async function supportedIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Set();
  const { data } = await supabase
    .from("community_supports")
    .select("post_id")
    .eq("user_id", auth.user.id)
    .in("post_id", postIds);
  return new Set(((data ?? []) as { post_id: string }[]).map((r) => r.post_id));
}

function rowToPost(row: PostRow, supported: boolean): CommunityPost {
  return {
    id: row.id,
    authorId: row.author_id,
    displayName: row.display_name,
    category: isCommunityCategory(row.category) ? row.category : "general",
    locale: row.locale,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    commentCount: Number(row.comment_count ?? 0),
    supportCount: Number(row.support_count ?? 0),
    supported,
  };
}
