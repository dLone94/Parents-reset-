import type { LoadArea, ResetRecord } from "@/types/reset";

export interface HistorySummary {
  count: number;
  /** Average overwhelm of the most recent resets (up to 7). */
  recentAverage: number | null;
  /** Average overwhelm of the resets before those, for comparison. */
  earlierAverage: number | null;
  /** Areas that show up most often, most frequent first. */
  frequentAreas: LoadArea[];
  /** Overwhelm scores oldest → newest, capped to the last 14 resets. */
  trend: number[];
}

/**
 * Small, honest numbers for the history page. No streaks, no scores to chase:
 * just whether things have been getting lighter.
 */
export function summariseHistory(records: ResetRecord[]): HistorySummary {
  const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const scores = sorted.map((r) => r.answers.overwhelm);
  const recent = scores.slice(-7);
  const earlier = scores.slice(-14, -7);

  const counts = new Map<LoadArea, number>();
  for (const r of sorted) for (const area of r.answers.areas) counts.set(area, (counts.get(area) ?? 0) + 1);
  const frequentAreas = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([area]) => area).slice(0, 3);

  return {
    count: sorted.length,
    recentAverage: average(recent),
    earlierAverage: average(earlier),
    frequentAreas,
    trend: scores.slice(-14),
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** Fraction of today items ticked off for a record, 0..1, or null when none. */
export function completionRatio(record: ResetRecord): number | null {
  const total = record.plan.today.length;
  if (total === 0) return null;
  const done = (record.completedItemIds ?? []).filter((id) => record.plan.today.some((i) => i.id === id)).length;
  return done / total;
}
