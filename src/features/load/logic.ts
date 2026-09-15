import {
  loadCategories,
  type LoadCategory,
  type LoadItem,
  type LoadItemStatus,
  type LoadLevel,
} from "@/types/load";

/** Postponed items come back automatically after this many hours. */
export const POSTPONE_HOURS = 24;

/**
 * The status the UI should treat an item as having right now. A postponed
 * item whose time has passed behaves as open again without needing a write.
 */
export function effectiveStatus(item: LoadItem, now: Date = new Date()): LoadItemStatus {
  if (item.status === "postponed" && item.postponedUntil) {
    return new Date(item.postponedUntil).getTime() <= now.getTime() ? "open" : "postponed";
  }
  return item.status;
}

export function postponeUntil(from: Date = new Date()): string {
  return new Date(from.getTime() + POSTPONE_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Load score = number of items that are open right now. Postponed items count
 * half, because they are still in the head but not in the way today.
 */
export function loadScore(items: LoadItem[], category: LoadCategory, now: Date = new Date()): number {
  let score = 0;
  for (const item of items) {
    if (item.category !== category) continue;
    const status = effectiveStatus(item, now);
    if (status === "open") score += 1;
    else if (status === "postponed") score += 0.5;
  }
  return score;
}

/** Maps a score to a level that the UI can label and colour. */
export function loadLevel(score: number): LoadLevel {
  if (score <= 0) return "clear";
  if (score <= 2) return "light";
  if (score <= 4) return "busy";
  return "heavy";
}

export function scoresByCategory(
  items: LoadItem[],
  now: Date = new Date(),
): Record<LoadCategory, { score: number; level: LoadLevel; open: number }> {
  const result = {} as Record<LoadCategory, { score: number; level: LoadLevel; open: number }>;
  for (const category of loadCategories) {
    const score = loadScore(items, category, now);
    const open = items.filter(
      (i) => i.category === category && effectiveStatus(i, now) === "open",
    ).length;
    result[category] = { score, level: loadLevel(score), open };
  }
  return result;
}

/** Sort helper: open first (newest first), then postponed, then done. */
export function sortForDisplay(items: LoadItem[], now: Date = new Date()): LoadItem[] {
  const rank: Record<LoadItemStatus, number> = { open: 0, postponed: 1, done: 2 };
  return [...items].sort((a, b) => {
    const diff = rank[effectiveStatus(a, now)] - rank[effectiveStatus(b, now)];
    if (diff !== 0) return diff;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
