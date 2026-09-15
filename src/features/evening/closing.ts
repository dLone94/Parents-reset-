import type { DayWeather } from "@/types/journal";

export interface ClosingContext {
  weather?: DayWeather;
  hasHard: boolean;
  hasKept: boolean;
  resetToday: boolean;
  /** Evenings closed in the last seven days, including this one. */
  closedInLastWeek: number;
}

/**
 * The line a parent reads after closing their day.
 *
 * Deterministic and returned as a translation key, like the planner: the app
 * never generates an English sentence, and the same evening reads the same in
 * every language. The order matters — a hard day is answered before anything
 * congratulates them on a habit.
 */
export function closingKey(context: ClosingContext): string {
  if (context.weather === "storm") {
    return context.hasKept ? "stormKept" : "storm";
  }
  if (context.weather === "rain" && context.hasHard) {
    return "rainHard";
  }
  if (context.hasKept) {
    return "kept";
  }
  if (context.hasHard) {
    return "heard";
  }
  if (context.resetToday) {
    return "afterReset";
  }
  if (context.closedInLastWeek >= 3) {
    return "steady";
  }
  return "plain";
}

export const closingKeys = [
  "storm",
  "stormKept",
  "rainHard",
  "kept",
  "heard",
  "afterReset",
  "steady",
  "plain",
] as const;
