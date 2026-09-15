import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KeptView } from "@/features/kept/components/KeptView";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("kept.title") },
    description: t("kept.description"),
    alternates: buildAlternates(locale, "/kept"),
    robots: { index: false },
  };
}

export default async function KeptPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <KeptView />;
}
