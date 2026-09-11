import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Narrow } from "@/components/ui/Container";
import { ensureProfile } from "@/features/account/actions";
import { AccountSettings } from "@/features/account/components/AccountSettings";
import { AuthForm } from "@/features/account/components/AuthForm";
import { buildAlternates } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/user";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("account.title") },
    description: t("account.description"),
    alternates: buildAlternates(locale, "/account"),
    robots: { index: false },
  };
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { next, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "account" });

  if (!isSupabaseConfigured()) {
    return (
      <Narrow className="flex flex-col gap-6 py-10 md:py-16">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
          <h1 className="font-display text-3xl leading-tight md:text-5xl">{t("unavailable.title")}</h1>
          <p className="text-lg text-ink-soft">{t("unavailable.body")}</p>
        </header>
      </Narrow>
    );
  }

  const user = await getCurrentUser();
  const profile = user ? await ensureProfile() : null;

  return (
    <Narrow className="flex flex-col gap-6 py-10 md:py-16">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">{t("title")}</p>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">
          {user ? t("signedIn.title") : t("signedOut.title")}
        </h1>
        <p className="text-lg text-ink-soft">{user ? t("signedIn.body") : t("signedOut.body")}</p>
        {error === "link" && (
          <p role="alert" className="rounded-2xl border border-clay bg-clay-soft px-4 py-3 text-base">
            {t("auth.errors.link")}
          </p>
        )}
      </header>
      {user && profile ? (
        <AccountSettings email={user.email} displayName={profile.displayName} />
      ) : (
        <AuthForm next={next} />
      )}
    </Narrow>
  );
}
