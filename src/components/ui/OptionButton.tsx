"use client";

import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  children: ReactNode;
  /** "chip" renders a compact pill; "card" renders a full-width row. */
  appearance?: "chip" | "card";
}

/** Selectable option with a large tap target and visible pressed state. */
export function OptionButton({
  selected,
  appearance = "card",
  className,
  children,
  ...rest
}: OptionButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "tap focus-ring border text-left transition-colors duration-150",
        appearance === "card"
          ? "flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-lg"
          : "inline-flex items-center rounded-full px-4 py-2.5 text-base font-medium",
        selected
          ? "border-clay bg-clay-soft text-ink"
          : "border-line bg-paper text-ink hover:border-ink-muted",
        className,
      )}
      {...rest}
    >
      <span className="flex-1">{children}</span>
      {appearance === "card" && (
        <span
          aria-hidden
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-clay bg-clay text-paper" : "border-line bg-paper",
          )}
        >
          {selected && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}
    </button>
  );
}
