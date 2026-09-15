import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CommunityPost } from "../types";
import { RelativeTime } from "./RelativeTime";
import { SupportButton } from "./SupportButton";

export function PostCard({ post, signedIn }: { post: CommunityPost; signedIn: boolean }) {
  const t = useTranslations("community");
  const snippet = post.body.length > 220 ? `${Array.from(post.body).slice(0, 220).join("")}…` : post.body;
  return (
    <article className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <span className="rounded-full bg-sand px-2.5 py-0.5 font-semibold text-ink-soft">{t(`categories.${post.category}`)}</span>
        <span>{post.displayName}</span>
        <span aria-hidden>·</span>
        <RelativeTime iso={post.createdAt} />
      </div>
      <h2 className="font-display mt-3 text-2xl leading-snug">
        <Link href={`/community/${post.id}`} className="focus-ring rounded-md hover:underline underline-offset-4">
          {post.title}
        </Link>
      </h2>
      <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-ink-soft">{snippet}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SupportButton postId={post.id} count={post.supportCount} supported={post.supported} signedIn={signedIn} />
        <Link href={`/community/${post.id}`} className="focus-ring rounded-full text-sm font-semibold text-ink-soft underline-offset-4 hover:underline">
          {t("comments", { count: post.commentCount })}
        </Link>
      </div>
    </article>
  );
}
