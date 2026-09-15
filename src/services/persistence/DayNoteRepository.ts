import type { DayNote } from "@/types/journal";

/**
 * Persistence boundary for evening closes. Same shape as the other
 * repositories: guests write to the device, accounts write to Supabase, and
 * "export my data" and "delete my history" stay one call each.
 */
export interface DayNoteRepository {
  /** Newest first. */
  list(): Promise<DayNote[]>;
  /** The note for a local calendar day (YYYY-MM-DD), if the day was closed. */
  getByDay(day: string): Promise<DayNote | null>;
  save(note: DayNote): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
