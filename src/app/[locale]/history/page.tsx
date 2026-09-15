import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HistoryView } from "@/features/history/components/HistoryView";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("history.title") },
    description: t("history.description"),
    alternates: buildAlternates(locale, "/history"),
    robots: { index: false },
  };
}

export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HistoryView />;
}
