import { localDay } from "@/lib/utils/day";

export const PAUSE_LOG_KEY = "parent-reset:pauses:v1";
const MAX_ENTRIES = 200;

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Finished pauses, as ISO timestamps on the device.
 *
 * Deliberately not synced to an account: how often someone needed to breathe
 * is the most private thing this app knows, and nothing in the product needs
 * it on a server. It powers one gentle line ("that is your second today") and
 * nothing else.
 */
export function readPauses(storage: KeyValueStorage | null = defaultStorage()): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PAUSE_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]).filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function recordPause(
  at: Date = new Date(),
  storage: KeyValueStorage | null = defaultStorage(),
): string[] {
  const next = [at.toISOString(), ...readPauses(storage)].slice(0, MAX_ENTRIES);
  try {
    storage?.setItem(PAUSE_LOG_KEY, JSON.stringify(next));
  } catch {
    // Blocked storage: the pause still happened, which is the point.
  }
  return next;
}

/** How many pauses fall on a given local day. */
export function pausesOnDay(entries: string[], day: string): number {
  return entries.filter((entry) => {
    const date = new Date(entry);
    return !Number.isNaN(date.getTime()) && localDay(date) === day;
  }).length;
}

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
