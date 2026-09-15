import type { LoadItem } from "@/types/load";

/**
 * Persistence boundary for Family Load items. Guests use the local
 * implementation; signed-in users will use the Supabase one with the same
 * shape. Deliberately tiny: add, update, remove, list, clear.
 */
export interface LoadRepository {
  list(): Promise<LoadItem[]>;
  add(item: LoadItem): Promise<void>;
  update(id: string, patch: Partial<Omit<LoadItem, "id" | "createdAt">>): Promise<LoadItem | null>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
