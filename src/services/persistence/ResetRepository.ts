import type { ResetRecord } from "@/types/reset";

/**
 * Persistence boundary for resets. Guests use the local implementation;
 * signed-in users will use the Supabase implementation with the same shape.
 * Keeping this narrow makes "delete my history" and "export my data" trivial.
 */
export interface ResetRepository {
  save(record: ResetRecord): Promise<void>;
  get(id: string): Promise<ResetRecord | null>;
  list(): Promise<ResetRecord[]>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
