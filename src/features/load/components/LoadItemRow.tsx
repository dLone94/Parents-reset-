"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";
import { loadCategories, type LoadCategory, type LoadItem, type LoadItemStatus } from "@/types/load";

interface LoadItemRowProps {
  item: LoadItem;
  status: LoadItemStatus;
  onComplete: () => void;
  onReopen: () => void;
  onPostpone: () => void;
  onMove: (category: LoadCategory) => void;
  onRemove: () => void;
}

export function LoadItemRow({ item, status, onComplete, onReopen, onPostpone, onMove, onRemove }: LoadItemRowProps) {
  const t = useTranslations("load");
  const locale = useLocale();
  const isDone = status === "done";
  const isPostponed = status === "postponed";
  const moveId = `move-${item.id}`;

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-line bg-paper px-4 py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={isDone ? onReopen : onComplete}
          aria-label={isDone ? t("actions.undo") : t("actions.done")}
          aria-pressed={isDone}
          className={cn(
            "tap focus-ring mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
            isDone ? "border-moss bg-moss text-paper" : "border-line bg-paper hover:border-moss",
          )}
          style={{ minHeight: "1.75rem" }}
        >
          {isDone && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("text-lg leading-snug", isDone && "text-ink-muted line-through")}>{item.title}</p>
          {isPostponed && item.postponedUntil && (
            <p className="text-sm text-honey">
              {t("postponedUntil", { date: formatDate(item.postponedUntil, locale, { dateStyle: "medium" }) })}
            </p>
          )}
          {isDone && item.completedAt && (
            <p className="text-sm text-ink-muted">
              {t("completedOn", { date: formatDate(item.completedAt, locale, { dateStyle: "medium" }) })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pl-10">
        {isDone ? (
          <>
            <ActionButton onClick={onReopen}>{t("actions.undo")}</ActionButton>
            <ActionButton onClick={onRemove}>{t("actions.remove")}</ActionButton>
          </>
        ) : (
          <>
            {isPostponed ? (
              <ActionButton onClick={onReopen}>{t("actions.bringBack")}</ActionButton>
            ) : (
              <ActionButton onClick={onPostpone}>{t("actions.postpone")}</ActionButton>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
              <span className="sr-only">{t("actions.move")}</span>
              <select
                id={moveId}
                aria-label={t("actions.move")}
                value={item.category}
                onChange={(event) => onMove(event.target.value as LoadCategory)}
                className="tap focus-ring cursor-pointer rounded-full border border-line bg-paper py-1.5 pl-3 pr-7 text-sm text-ink"
                style={{ minHeight: "2.25rem" }}
              >
                {loadCategories.map((category) => (
                  <option key={category} value={category}>
                    {t(`categories.${category}`)}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </li>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink-muted hover:text-ink"
      style={{ minHeight: "2.25rem" }}
    >
      {children}
    </button>
  );
}
