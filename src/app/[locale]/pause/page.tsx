import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PauseScreen } from "@/features/pause/components/PauseScreen";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("pause.title") },
    description: t("pause.description"),
    alternates: buildAlternates(locale, "/pause"),
  };
}

export default async function PausePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PauseScreen />;
}
