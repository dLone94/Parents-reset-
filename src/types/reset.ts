import type { Locale } from "@/i18n/locales";

export const loadAreas = [
  "kids",
  "money",
  "work",
  "home",
  "relationship",
  "health",
  "other",
] as const;
export type LoadArea = (typeof loadAreas)[number];

export const timeOptions = ["under30", "30to60", "1to2h", "over2h"] as const;
export type TimeAvailable = (typeof timeOptions)[number];

/** Limits are counted in Unicode code points, not bytes or English words. */
export const limits = {
  mustHappenMax: 500,
  onMindMax: 1000,
  maxParsedItems: 6,
} as const;

export interface ResetAnswers {
  /** 1 = calm, 10 = completely maxed out */
  overwhelm: number;
  areas: LoadArea[];
  time: TimeAvailable;
  moneyPressure: boolean;
  mustHappen: string;
  onMind?: string;
}

export type PlanBucket = "today" | "thisWeek" | "letGo";

/**
 * A plan item is either the user's own words (stored verbatim, never rewritten)
 * or a semantic message key that the UI localises. The planner never returns
 * hard-coded English sentences.
 */
export interface PlanItem {
  id: string;
  bucket: PlanBucket;
  source: "user" | "planner";
  /** Verbatim user text when source === "user". */
  text?: string;
  /** Translation key under the `planner` namespace when source === "planner". */
  messageKey?: string;
  /** Optional area the item relates to (used for subtle colour/labels). */
  area?: LoadArea;
  /** Optional translation key for a short explanatory line. */
  noteKey?: string;
}

export interface ResetPlan {
  /** Translation key describing today's overall picture. */
  summaryKey: string;
  /** Translation key describing how time shapes the list. */
  timeKey: string;
  today: PlanItem[];
  thisWeek: PlanItem[];
  letGo: PlanItem[];
}

export interface ResetRecord {
  id: string;
  createdAt: string;
  locale: Locale;
  answers: ResetAnswers;
  plan: ResetPlan;
  safetyFlag: boolean;
}
