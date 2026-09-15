"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  /** Signed-in user's email, or null for guests. */
  userEmail: string | null;
}

export function Header({ userEmail }: HeaderProps) {
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
  // Everything lives in the mobile sheet; the desktop bar keeps only three so
  // the header never wraps in German or Finnish.
  const links = [
    { href: "/pause", label: t("nav.pause") },
    { href: "/load", label: t("nav.familyLoad") },
    { href: "/evening", label: t("nav.evening") },
    { href: "/kept", label: t("nav.kept") },
    { href: "/community", label: t("nav.community") },
    { href: "/history", label: t("nav.history") },
  ] as const;
  const desktopLinks = links.filter((link) => ["/pause", "/load", "/community"].includes(link.href));
  const initial = userEmail ? userEmail.slice(0, 1).toUpperCase() : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="focus-ring rounded-full" aria-label={t("common.appName")}>
          <Logo label={t("common.appName")} />
        </Link>

        {/* Desktop */}
        <nav aria-label={t("nav.menuTitle")} className="hidden items-center gap-1 md:flex">
          {desktopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "tap focus-ring inline-flex items-center rounded-full px-3.5 text-base hover:text-ink",
                pathname.startsWith(link.href) ? "font-semibold text-ink" : "text-ink-soft",
              )}
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher id="language-switcher-desktop" />
          <Link
            href="/account"
            aria-label={t("nav.account")}
            className={cn(
              "tap focus-ring ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-sm font-semibold",
              pathname.startsWith("/account") ? "border-clay text-clay-deep" : "text-ink-soft",
            )}
          >
            {initial ?? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20a8 8 0 0116 0" strokeLinecap="round" />
              </svg>
            )}
          </Link>
          {!inReset && (
            <Link href="/reset" className={cn(buttonClassName("primary", "md"), "ml-1")}>
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
      <div id="mobile-menu" hidden={!open} className={cn("md:hidden", open && "fade-in")}>
        <div className="border-t border-line bg-cream">
          <Container className="flex flex-col gap-2 py-5">
            <Link href="/" onClick={close} className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand">
              {t("nav.home")}
            </Link>
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand">
                {link.label}
              </Link>
            ))}
            <Link href="/account" onClick={close} className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand">
              {userEmail ? t("nav.account") : t("nav.signIn")}
            </Link>
            <Link href="/#how-it-works" onClick={close} className="tap focus-ring flex items-center rounded-2xl px-4 text-lg text-ink hover:bg-sand">
              {t("nav.howItWorks")}
            </Link>
            <Link href="/reset" onClick={close} className={cn(buttonClassName("primary", "lg"), "mt-2 w-full")}>
              {t("nav.startReset")}
            </Link>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-base text-ink-soft">{t("common.language")}</span>
              <LanguageSwitcher id="language-switcher-mobile" />
            </div>
            <ThemeToggle className="pt-1" />
          </Container>
        </div>
      </div>
    </header>
  );
}
