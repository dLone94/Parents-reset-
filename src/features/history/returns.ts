import { daysBetween } from "@/lib/utils/day";

export interface ReturnsSummary {
  /** Days on which the parent did anything at all. Never resets to zero. */
  total: number;
  /** Days in the last seven. */
  thisWeek: number;
  /** Distinct calendar weeks with at least one visit. */
  weeks: number;
  /** Days since the most recent visit before today. */
  sinceLast: number;
  /** The longest gap they have already come back from. */
  longestGap: number;
  firstDay: string | null;
  lastDay: string | null;
}

/**
 * The anti-streak.
 *
 * A streak counts days in a row and punishes the first hard week, which is
 * exactly the week a parent most needs this app. Returns counts comings-back
 * instead: it only ever goes up, and the longest gap is kept as evidence that
 * coming back after a bad stretch is the normal thing to do, not a failure.
 */
export function summariseReturns(days: string[], today: string): ReturnsSummary {
  const unique = Array.from(new Set(days)).sort();
  if (unique.length === 0) {
    return { total: 0, thisWeek: 0, weeks: 0, sinceLast: 0, longestGap: 0, firstDay: null, lastDay: null };
  }

  let longestGap = 0;
  for (let i = 1; i < unique.length; i += 1) {
    longestGap = Math.max(longestGap, daysBetween(unique[i - 1], unique[i]));
  }

  const lastDay = unique[unique.length - 1];
  const weekKeys = new Set(unique.map(isoWeekKey));

  return {
    total: unique.length,
    thisWeek: unique.filter((day) => daysBetween(day, today) < 7 && daysBetween(day, today) >= 0).length,
    weeks: weekKeys.size,
    sinceLast: Math.max(0, daysBetween(lastDay, today)),
    longestGap,
    firstDay: unique[0],
    lastDay,
  };
}

/** Which line to show. Deterministic, and never scolds a gap. */
export function returnsKey(summary: ReturnsSummary): string {
  if (summary.total === 0) return "none";
  if (summary.total === 1) return "first";
  if (summary.sinceLast >= 7) return "welcomeBack";
  if (summary.thisWeek >= 3) return "often";
  if (summary.weeks >= 3) return "weeks";
  return "growing";
}

/** ISO week key (YYYY-Www), so "weeks you showed up" matches a calendar. */
export function isoWeekKey(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, date ?? 1));
  // Thursday of the current week decides the ISO year.
  const dayOfWeek = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - dayOfWeek + 3);
  const isoYear = utc.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayOfWeek = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayOfWeek + 3);
  const week = 1 + Math.round((utc.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${isoYear}-W${`${week}`.padStart(2, "0")}`;
}
