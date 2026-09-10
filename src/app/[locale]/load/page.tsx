import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FamilyLoad } from "@/features/load/components/FamilyLoad";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("load.title") },
    description: t("load.description"),
    alternates: buildAlternates(locale, "/load"),
  };
}

export default async function LoadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FamilyLoad />;
}
