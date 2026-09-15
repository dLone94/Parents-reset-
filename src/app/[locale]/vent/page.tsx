import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VentScreen } from "@/features/vent/components/VentScreen";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("vent.title") },
    description: t("vent.description"),
    alternates: buildAlternates(locale, "/vent"),
    robots: { index: false },
  };
}

export default async function VentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VentScreen />;
}
