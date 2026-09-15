import { daysBetween, localDay } from "@/lib/utils/day";
import type { DayNote, DayWeather } from "@/types/journal";

export interface WeekDay {
  /** Local day key, YYYY-MM-DD. */
  day: string;
  /** The weather chosen that evening, if the day was closed with one. */
  weather?: DayWeather;
  /** True when the evening was closed at all, with or without weather. */
  closed: boolean;
  isToday: boolean;
}

export const WEEK_LENGTH = 7;

/**
 * The last seven days, oldest first, whether or not they were closed.
 *
 * Days with nothing are part of the picture: a week with three blanks is a
 * real week, and the strip should show it without turning the blanks into a
 * reproach.
 */
export function weekStrip(notes: DayNote[], today: string = localDay()): WeekDay[] {
  const byDay = new Map(notes.map((note) => [note.day, note]));
  const days: WeekDay[] = [];

  for (let offset = WEEK_LENGTH - 1; offset >= 0; offset -= 1) {
    const day = shiftDay(today, -offset);
    const note = byDay.get(day);
    days.push({
      day,
      weather: note?.weather,
      closed: Boolean(note),
      isToday: offset === 0,
    });
  }
  return days;
}

/** How many of the last seven days were closed. */
export function closedThisWeek(notes: DayNote[], today: string = localDay()): number {
  return notes.filter((note) => {
    const gap = daysBetween(note.day, today);
    return gap >= 0 && gap < WEEK_LENGTH;
  }).length;
}

function shiftDay(day: string, by: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(year, (month ?? 1) - 1, (date ?? 1) + by, 12);
  return localDay(shifted);
}
