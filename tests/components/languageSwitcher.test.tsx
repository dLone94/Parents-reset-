import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { localeNames, locales } from "@/i18n/locales";

const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/reset",
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { Header } from "@/components/layout/Header";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function wrap(ui: React.ReactElement, locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={en}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  it("lists every supported language by its native name", () => {
    wrap(<LanguageSwitcher />);
    const select = screen.getByRole("combobox", { name: en.common.language });
    const options = Array.from(select.querySelectorAll("option"));
    expect(options).toHaveLength(locales.length);
    for (const locale of locales) {
      expect(options.map((o) => o.textContent)).toContain(localeNames[locale]);
    }
  });

  it("navigates to the same path under the chosen locale", async () => {
    wrap(<LanguageSwitcher />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "bg");
    expect(replace).toHaveBeenCalledWith("/reset", { locale: "bg" });
  });
});

describe("mobile menu", () => {
  it("opens from the hamburger and contains the language selector", async () => {
    wrap(<Header userEmail={null} />);
    const menu = document.getElementById("mobile-menu") as HTMLElement;
    expect(menu).toHaveAttribute("hidden");
    await userEvent.click(screen.getByRole("button", { name: en.common.openMenu }));
    expect(menu).not.toHaveAttribute("hidden");
    expect(menu.querySelector("select#language-switcher-mobile")).not.toBeNull();
    expect(menu.textContent).toContain(en.nav.startReset);
  });
});
