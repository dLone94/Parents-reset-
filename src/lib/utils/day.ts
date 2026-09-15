/**
 * Local calendar days, as YYYY-MM-DD.
 *
 * Always local, never UTC: a parent closing their day at 23:40 in Bucharest
 * means that day, not tomorrow. Timestamps stay ISO; only the day key is local.
 */
export function localDay(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Midday on a local day key, so formatting never slips across a timezone edge. */
export function dayToDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, date ?? 1, 12, 0, 0, 0);
}

/** Whole days between two local day keys. Negative when `from` is later. */
export function daysBetween(from: string, to: string): number {
  const ms = dayToDate(to).getTime() - dayToDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return localDay(a) === localDay(b);
}
