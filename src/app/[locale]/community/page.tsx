import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CategoryChips } from "@/features/community/components/CategoryChips";
import { PostCard } from "@/features/community/components/PostCard";
import { listPosts } from "@/features/community/queries";
import { isCommunityCategory } from "@/features/community/schema";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";
import { getCurrentUser } from "@/lib/supabase/user";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("community.title") },
    description: t("community.description"),
    alternates: buildAlternates(locale, "/community"),
  };
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "community" });
  const active = isCommunityCategory(category) ? category : undefined;

  const [posts, user] = await Promise.all([
    listPosts(active).catch(() => [] as NonNullable<Awaited<ReturnType<typeof listPosts>>>),
    getCurrentUser(),
  ]);

  return (
    <Container className="flex flex-col gap-6 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">{t("subtitle")}</h1>
        <p className="max-w-2xl text-lg text-ink-soft">{t("intro")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={active ? `/community/new?category=${active}` : "/community/new"} className={buttonClassName("primary", "lg")}>
            {t("write")}
          </Link>
          <p className="text-sm text-ink-muted">{t("anonymousNote")}</p>
        </div>
      </header>

      <CategoryChips active={active} />

      {posts === null ? (
        <div className="rounded-3xl border border-dashed border-line bg-paper/60 p-6">
          <p className="font-semibold">{t("unavailable.title")}</p>
          <p className="mt-1 text-base text-ink-soft">{t("unavailable.body")}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-paper/60 p-6">
          <p className="font-semibold">{t("empty.title")}</p>
          <p className="mt-1 text-base text-ink-soft">{t("empty.body")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} signedIn={user !== null} />
          ))}
        </div>
      )}

      <p className="text-sm text-ink-muted">{t("safetyNote")}</p>
    </Container>
  );
}
