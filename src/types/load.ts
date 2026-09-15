/**
 * Family Load: a lightweight view of what is occupying a parent's head, by
 * category. Not a project-management system: an item is a short title with a
 * status, nothing more.
 */
export const loadCategories = ["kids", "money", "home", "work", "relationship", "me"] as const;
export type LoadCategory = (typeof loadCategories)[number];

export const loadItemStatuses = ["open", "done", "postponed"] as const;
export type LoadItemStatus = (typeof loadItemStatuses)[number];

export const loadLimits = {
  titleMax: 120,
  /** Cap per device so a guest browser never accumulates unbounded data. */
  maxItems: 200,
} as const;

export interface LoadItem {
  id: string;
  category: LoadCategory;
  /** The user's own words, stored verbatim. */
  title: string;
  status: LoadItemStatus;
  createdAt: string;
  updatedAt: string;
  /** Set when status becomes "done". */
  completedAt?: string;
  /** Set when status becomes "postponed"; the item comes back after this time. */
  postponedUntil?: string;
}

/** Load level for a category, derived from the open items. */
export type LoadLevel = "clear" | "light" | "busy" | "heavy";
