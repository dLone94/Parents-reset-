import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { Narrow } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <Narrow className="flex flex-1 flex-col items-start justify-center gap-4 py-24">
      <h1 className="font-display text-4xl">{t("title")}</h1>
      <p className="text-lg text-ink-soft">{t("body")}</p>
      <Link href="/" className={buttonClassName("primary", "lg")}>
        {t("cta")}
      </Link>
    </Narrow>
  );
}
