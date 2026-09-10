import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResultView } from "@/features/reset/components/ResultView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { absolute: t("result.title") },
    description: t("result.description"),
    // Results are personal and only exist on the user's device.
    robots: { index: false, follow: false },
  };
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ResultView id={id} />;
}
