"use client";

import { cn } from "@/lib/utils/cn";
import type { LoadLevel } from "@/types/load";
import { LoadMeter, levelStyles } from "./LoadMeter";

interface CategoryCardProps {
  label: string;
  openLabel: string;
  levelLabel: string;
  level: LoadLevel;
  score: number;
  selected: boolean;
  onSelect: () => void;
}

export function CategoryCard({ label, openLabel, levelLabel, level, score, selected, onSelect }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "tap focus-ring flex flex-col gap-3 rounded-2xl border bg-paper p-4 text-left shadow-soft transition-colors",
        selected ? "border-clay" : "border-line hover:border-ink-muted",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <span className="min-w-0 text-lg font-semibold leading-tight [overflow-wrap:normal] hyphens-auto">
          {label}
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", levelStyles[level].chip)}>
          {levelLabel}
        </span>
      </div>
      <LoadMeter score={score} level={level} label={`${label}: ${levelLabel}`} />
      <span className="text-sm text-ink-soft">{openLabel}</span>
    </button>
  );
}
