import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EveningClose } from "@/features/evening/components/EveningClose";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("evening.title") },
    description: t("evening.description"),
    alternates: buildAlternates(locale, "/evening"),
    robots: { index: false },
  };
}

export default async function EveningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EveningClose />;
}
