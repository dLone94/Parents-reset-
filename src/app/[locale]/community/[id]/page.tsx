import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Narrow } from "@/components/ui/Container";
import { CommentForm } from "@/features/community/components/CommentForm";
import { DeletePostButton } from "@/features/community/components/DeletePostButton";
import { RelativeTime } from "@/features/community/components/RelativeTime";
import { ReportButton } from "@/features/community/components/ReportButton";
import { SupportButton } from "@/features/community/components/SupportButton";
import { getPost, listComments } from "@/features/community/queries";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/supabase/user";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  const post = UUID.test(id) ? await getPost(id).catch(() => null) : null;
  return { title: post ? post.title : t("title"), robots: { index: false } };
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!UUID.test(id)) notFound();

  const [post, user] = await Promise.all([getPost(id).catch(() => null), getCurrentUser()]);
  if (!post) notFound();
  const comments = await listComments(id).catch(() => []);
  const t = await getTranslations({ locale, namespace: "community" });
  const signedIn = user !== null;

  return (
    <Narrow className="flex flex-col gap-8 py-8 md:py-14">
      <Link href="/community" className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline">
        {t("back")}
      </Link>

      <article className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          <span className="rounded-full bg-sand px-2.5 py-0.5 font-semibold text-ink-soft">{t(`categories.${post.category}`)}</span>
          <span>{post.displayName}</span>
          <span aria-hidden>·</span>
          <RelativeTime iso={post.createdAt} />
        </div>
        <h1 className="font-display text-3xl leading-tight md:text-4xl">{post.title}</h1>
        <p className="whitespace-pre-line text-lg leading-relaxed">{post.body}</p>
        <div className="flex flex-wrap items-center gap-4">
          <SupportButton postId={post.id} count={post.supportCount} supported={post.supported} signedIn={signedIn} />
          {user?.id === post.authorId ? <DeletePostButton postId={post.id} /> : <ReportButton postId={post.id} signedIn={signedIn} />}
        </div>
      </article>

      <section aria-labelledby="comments-title" className="space-y-4">
        <h2 id="comments-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {t("comments", { count: comments.length })}
        </h2>
        {comments.length === 0 && <p className="text-base text-ink-muted">{t("comment.empty")}</p>}
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
                <span>
                  <span className="font-semibold text-ink-soft">{comment.displayName}</span>
                  <span aria-hidden> · </span>
                  <RelativeTime iso={comment.createdAt} />
                </span>
                {user?.id !== comment.authorId && <ReportButton commentId={comment.id} signedIn={signedIn} />}
              </div>
              <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{comment.body}</p>
            </li>
          ))}
        </ul>
        <CommentForm postId={post.id} signedIn={signedIn} />
      </section>
    </Narrow>
  );
}
