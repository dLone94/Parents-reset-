import { daysBetween } from "@/lib/utils/day";
import type { KeptMoment } from "@/types/journal";

/** A kept moment has to be this old before it comes back. */
export const RESURFACE_AFTER_DAYS = 7;

/**
 * Stable per day: the same parent sees the same memory all day instead of a
 * new one on every render, and a different one tomorrow.
 */
function hashDay(day: string): number {
  let hash = 0;
  for (const char of day) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

/**
 * Picks one older moment to show again.
 *
 * This is the quiet heart of the app: not a quote from a stranger, but
 * something the parent themselves thought was worth keeping, handed back weeks
 * later when they have forgotten it. Recent days are excluded — yesterday is
 * not a memory yet.
 */
export function pickResurfaced(
  moments: KeptMoment[],
  today: string,
  minimumAgeDays: number = RESURFACE_AFTER_DAYS,
): KeptMoment | null {
  const eligible = moments.filter((moment) => daysBetween(moment.day, today) >= minimumAgeDays);
  if (eligible.length === 0) return null;
  const ordered = [...eligible].sort((a, b) => a.day.localeCompare(b.day) || a.id.localeCompare(b.id));
  return ordered[hashDay(today) % ordered.length];
}
