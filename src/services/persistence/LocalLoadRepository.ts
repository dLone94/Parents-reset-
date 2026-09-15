import { loadLimits, type LoadItem } from "@/types/load";
import type { LoadRepository } from "./LoadRepository";

export const LOCAL_LOAD_KEY = "parent-reset:load:v1";

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Stores Family Load items in localStorage for guests. */
export class LocalLoadRepository implements LoadRepository {
  constructor(private readonly storage: KeyValueStorage | null = defaultStorage()) {}

  private read(): LoadItem[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(LOCAL_LOAD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as LoadItem[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: LoadItem[]): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(LOCAL_LOAD_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: keep the in-memory state for this session.
    }
  }

  async list(): Promise<LoadItem[]> {
    return this.read();
  }

  async add(item: LoadItem): Promise<void> {
    const items = this.read().filter((i) => i.id !== item.id);
    // Newest first; drop the oldest *done* items first when over the cap.
    let next = [item, ...items];
    if (next.length > loadLimits.maxItems) {
      const done = next.filter((i) => i.status === "done");
      const keep = new Set(next.slice(0, loadLimits.maxItems).map((i) => i.id));
      for (const d of done.reverse()) {
        if (next.length <= loadLimits.maxItems) break;
        next = next.filter((i) => i.id !== d.id);
        keep.delete(d.id);
      }
      next = next.slice(0, loadLimits.maxItems);
    }
    this.write(next);
  }

  async update(id: string, patch: Partial<Omit<LoadItem, "id" | "createdAt">>): Promise<LoadItem | null> {
    const items = this.read();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const updated: LoadItem = { ...items[index], ...patch, id, createdAt: items[index].createdAt };
    items[index] = updated;
    this.write(items);
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((i) => i.id !== id));
  }

  async clear(): Promise<void> {
    this.storage?.removeItem(LOCAL_LOAD_KEY);
  }
}

function defaultStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
