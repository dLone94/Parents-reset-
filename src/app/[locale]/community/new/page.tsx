import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Narrow } from "@/components/ui/Container";
import { PostForm } from "@/features/community/components/PostForm";
import { isCommunityCategory } from "@/features/community/schema";
import { redirect } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/user";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return { title: t("new.heading"), robots: { index: false } };
}

export default async function NewPostPage({
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

  if (!isSupabaseConfigured()) {
    return (
      <Narrow className="py-12">
        <h1 className="font-display text-3xl">{t("unavailable.title")}</h1>
        <p className="mt-2 text-lg text-ink-soft">{t("unavailable.body")}</p>
      </Narrow>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect({ href: "/account?next=/community/new", locale });

  return (
    <Narrow className="flex flex-col gap-6 py-8 md:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">{t("new.heading")}</h1>
        <p className="text-lg text-ink-soft">{t("new.intro")}</p>
      </header>
      <PostForm defaultCategory={isCommunityCategory(category) ? category : undefined} />
    </Narrow>
  );
}
