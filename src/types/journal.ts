import type { Locale } from "@/i18n/locales";

/**
 * How the day felt, as weather rather than a number. A 1-10 mood scale reads
 * like a clinical form; weather is something a tired parent can pick in one
 * tap and still recognise weeks later.
 */
export const dayWeather = ["storm", "rain", "cloudy", "sun"] as const;
export type DayWeather = (typeof dayWeather)[number];

export const journalLimits = {
  /** Counted in code points, so CJK text is not penalised. */
  hardMax: 500,
  keptMax: 500,
  tomorrowMax: 200,
  /** Cap per device so a guest browser never accumulates unbounded data. */
  maxNotes: 400,
} as const;

/**
 * One evening close. Every field is optional on purpose: a parent who only
 * taps the weather and leaves has still closed their day, and the app must
 * never make that feel like an unfinished form.
 */
export interface DayNote {
  id: string;
  /** Local calendar day as YYYY-MM-DD. One note per day; closing again edits it. */
  day: string;
  createdAt: string;
  updatedAt: string;
  locale: Locale;
  weather?: DayWeather;
  /** What was hard. Stored verbatim, never analysed or shown to anyone else. */
  hard?: string;
  /** The part worth keeping. This is what comes back to them later. */
  kept?: string;
  /** One thing for tomorrow, optionally pushed into Family Load. */
  tomorrow?: string;
}

/** A moment the parent chose to keep, lifted out of a day note. */
export interface KeptMoment {
  id: string;
  day: string;
  createdAt: string;
  text: string;
  weather?: DayWeather;
}

export function keptMoments(notes: DayNote[]): KeptMoment[] {
  return notes
    .filter((note): note is DayNote & { kept: string } => Boolean(note.kept?.trim()))
    .map((note) => ({
      id: note.id,
      day: note.day,
      createdAt: note.createdAt,
      text: note.kept.trim(),
      weather: note.weather,
    }));
}
