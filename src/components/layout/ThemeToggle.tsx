"use client";

import { useTranslations } from "next-intl";
import { themeChoices, type ThemeChoice } from "@/lib/theme";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "./ThemeProvider";

/**
 * Light, dark, or auto. Auto follows the phone and dims late in the evening,
 * which is what the label explains rather than leaving it as a surprise.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("theme");
  const { choice, setChoice } = useTheme();

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label={t("label")}
        className="inline-flex rounded-full border border-line bg-paper p-1"
      >
        {themeChoices.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={choice === option}
            onClick={() => setChoice(option)}
            className={cn(
              "focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              choice === option ? "bg-clay-soft text-clay-deep" : "text-ink-soft hover:text-ink",
            )}
          >
            <Icon choice={option} />
            <span>{t(option)}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-muted">{t("autoHint")}</p>
    </div>
  );
}

function Icon({ choice }: { choice: ThemeChoice }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (choice === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
      </svg>
    );
  }
  if (choice === "dark") {
    return (
      <svg {...common}>
        <path d="M20 13.4A8.2 8.2 0 1110.6 4a6.6 6.6 0 009.4 9.4z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 3.8a8.2 8.2 0 000 16.4z" fill="currentColor" stroke="none" />
    </svg>
  );
}
