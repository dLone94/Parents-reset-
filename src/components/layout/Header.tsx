"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const inReset = pathname.startsWith("/reset");

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="focus-ring rounded-full" aria-label={t("common.appName")}>
          <Logo label={t("common.appName")} />
        </Link>

        {/* Desktop */}
        <nav aria-label={t("nav.menuTitle")} className="hidden items-center gap-2 md:flex">
          <Link
            href="/load"
            className={cn(
              "tap focus-ring inline-flex items-center rounded-full px-4 text-base hover:text-ink",
              pathname.startsWith("/load") ? "text-ink font-semibold" : "text-ink-soft",
            )}
          >
            {t("nav.familyLoad")}
          </Link>
          <Link
            href="/#how-it-works"
            className="tap focus-ring inline-flex items-center rounded-full px-4 text-base text-ink-soft hover:text-ink"
          >
            {t("nav.howItWorks")}
          </Link>
          <LanguageSwitcher id="language-switcher-desktop" />
          {!inReset && (
            <Link href="/reset" className={buttonClassName("primary", "md")}>
              {t("nav.startReset")}
            </Link>
          )}
        </nav>

        {/* Mobile trigger */}
        <button
          type="button"
          className="tap focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </Container>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        hidden={!open}
        className={cn("md:hidden", open && "fade-in")}
      >
        <div className="border-t border-line bg-cream">
          <Container className="flex flex-col gap-3 py-5">
            <Link
              href="/"
              onClick={close}
              className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/load"
              onClick={close}
              className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand"
            >
              {t("nav.familyLoad")}
            </Link>
            <Link
              href="/#how-it-works"
              onClick={close}
              className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand"
            >
              {t("nav.howItWorks")}
            </Link>
            <Link href="/reset" onClick={close} className={cn(buttonClassName("primary", "lg"), "w-full")}>
              {t("nav.startReset")}
            </Link>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-base text-ink-soft">{t("common.language")}</span>
              <LanguageSwitcher id="language-switcher-mobile" />
            </div>
          </Container>
        </div>
      </div>
    </header>
  );
}
