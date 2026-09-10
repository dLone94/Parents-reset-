"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Footer() {
  const t = useTranslations();
  const pathname = usePathname();

  // The reset flow is a focused, one-handed screen with its own sticky action
  // bar. No footer there; the result page brings it back.
  if (pathname === "/reset") return null;

  return (
    <footer className="mt-auto border-t border-line bg-sand/60">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo label={t("common.appName")} />
          <p className="text-base text-ink-soft">{t("footer.tagline")}</p>
          <p className="text-sm text-ink-muted">{t("footer.notMedical")}</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft">{t("footer.language")}</span>
            <LanguageSwitcher id="language-switcher-footer" />
          </div>
          <p className="text-sm text-ink-muted">{t("footer.madeWithCare")}</p>
        </div>
      </Container>
    </footer>
  );
}
