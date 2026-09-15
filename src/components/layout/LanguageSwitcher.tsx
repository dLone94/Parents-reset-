"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { updateProfileLocale } from "@/features/account/actions";
import { localeNames, locales, type Locale } from "@/i18n/locales";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * Native <select> on purpose: it is accessible, works one-handed on every
 * phone, and the OS renders the long list well. Native names, no flags.
 * Choosing a language navigates to the same page under the new locale; the
 * proxy persists the choice in a cookie.
 */
export function LanguageSwitcher({
  className,
  id = "language-switcher",
}: {
  className?: string;
  id?: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as Locale });
    });
    // Remember the choice on the profile for signed-in users. Guests are
    // covered by the cookie the proxy sets. Best effort, never blocking.
    void updateProfileLocale(next).catch(() => {});
  }

  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <span className="sr-only">{t("language")}</span>
      <span aria-hidden className="text-ink-soft">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
      </span>
      <select
        id={id}
        value={locale}
        disabled={isPending}
        onChange={(event) => onChange(event.target.value)}
        className="tap focus-ring max-w-[12rem] cursor-pointer rounded-full border border-field bg-paper py-2 pl-3 pr-8 text-base text-ink"
      >
        {locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
