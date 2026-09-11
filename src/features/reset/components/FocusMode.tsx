"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { PlanItem } from "@/types/reset";

interface FocusModeProps {
  items: PlanItem[];
  completedIds: string[];
  onComplete: (id: string) => void;
  onClose: () => void;
  renderItem: (item: PlanItem) => React.ReactNode;
}

/**
 * One thing at a time, full screen. The rest of the list is hidden on
 * purpose: a parent with three minutes should see exactly one next step.
 */
export function FocusMode({ items, completedIds, onComplete, onClose, renderItem }: FocusModeProps) {
  const t = useTranslations("focus");
  const remaining = items.filter((i) => !completedIds.includes(i.id));
  const [index, setIndex] = useState(0);
  const current = remaining[Math.min(index, Math.max(0, remaining.length - 1))];
  const doneCount = items.length - remaining.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="focus-title" className="fixed inset-0 z-50 flex flex-col bg-cream">
      <div className="flex items-center justify-between px-5 py-4">
        <p id="focus-title" className="text-sm font-semibold uppercase tracking-[0.18em] text-clay">
          {t("title")}
        </p>
        <button type="button" onClick={onClose} className="tap focus-ring rounded-full px-3 text-base text-ink-soft hover:text-ink">
          {t("close")}
        </button>
      </div>

      <div className="flex justify-center gap-2 px-5" aria-label={t("progress", { done: doneCount, total: items.length })}>
        {items.map((item) => (
          <span
            key={item.id}
            className={cn("h-1.5 w-8 rounded-full", completedIds.includes(item.id) ? "bg-moss" : "bg-line")}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {current ? (
          <div key={current.id} className="fade-in max-w-lg space-y-6">
            <p className="text-base text-ink-soft">{t("next")}</p>
            <p className="font-display text-3xl leading-tight md:text-5xl">{renderItem(current)}</p>
            <p className="text-base text-ink-muted">{t("hint")}</p>
          </div>
        ) : (
          <div className="fade-in max-w-lg space-y-4">
            <span aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moss text-paper">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="font-display text-3xl leading-tight md:text-5xl">{t("allDone.title")}</p>
            <p className="text-lg text-ink-soft">{t("allDone.body")}</p>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-cream/95 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4">
        <div className="mx-auto flex max-w-lg gap-3">
          {current ? (
            <>
              <Button
                variant="ghost"
                size="lg"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setIndex((i) => (i + 1) % Math.max(1, remaining.length))}
                disabled={remaining.length < 2}
              >
                {t("skip")}
              </Button>
              <Button size="lg" fullWidth onClick={() => onComplete(current.id)}>
                {t("done")}
              </Button>
            </>
          ) : (
            <Button size="lg" fullWidth onClick={onClose}>
              {t("allDone.cta")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
