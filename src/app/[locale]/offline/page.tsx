import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offline" });
  return {
    title: { absolute: t("title") },
    description: t("body"),
    alternates: buildAlternates(locale, "/offline"),
    robots: { index: false },
  };
}

/**
 * Served by the service worker when a page is opened with no connection and
 * nothing cached for it. It lists what still works rather than apologising.
 */
export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "offline" });

  return (
    <Narrow className="flex min-h-[60vh] flex-col justify-center gap-8 py-8 md:py-14">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-honey">{t("eyebrow")}</p>
        <h1 className="font-display text-4xl md:text-5xl">{t("title")}</h1>
        <p className="text-lg leading-relaxed text-ink-soft">{t("body")}</p>
      </div>

      <ul className="space-y-3">
        {(["pause", "reset", "load", "evening"] as const).map((item) => (
          <li key={item} className="flex gap-3 text-lg leading-relaxed">
            <span aria-hidden className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-moss" />
            <span>{t(`works.${item}`)}</span>
          </li>
        ))}
      </ul>

      <p className="text-base text-ink-muted">{t("needsSignal")}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/pause" className={buttonClassName("primary", "lg")}>
          {t("cta")}
        </Link>
        <Link href="/" className={buttonClassName("secondary", "lg")}>
          {t("home")}
        </Link>
      </div>
    </Narrow>
  );
}
