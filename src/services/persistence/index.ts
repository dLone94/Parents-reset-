import type { DayNoteRepository } from "./DayNoteRepository";
import { LocalDayNoteRepository } from "./LocalDayNoteRepository";
import { LocalLoadRepository } from "./LocalLoadRepository";
import type { LoadRepository } from "./LoadRepository";
import { LocalResetRepository } from "./LocalResetRepository";
import type { ResetRepository } from "./ResetRepository";

export type { ResetRepository } from "./ResetRepository";
export { LocalResetRepository, LOCAL_RESETS_KEY } from "./LocalResetRepository";
export { SupabaseResetRepository } from "./SupabaseResetRepository";
export type { LoadRepository } from "./LoadRepository";
export { LocalLoadRepository, LOCAL_LOAD_KEY } from "./LocalLoadRepository";
export { SupabaseLoadRepository } from "./SupabaseLoadRepository";
export type { DayNoteRepository } from "./DayNoteRepository";
export { LocalDayNoteRepository, LOCAL_DAY_NOTES_KEY } from "./LocalDayNoteRepository";
export { SupabaseDayNoteRepository } from "./SupabaseDayNoteRepository";

let localInstance: ResetRepository | null = null;

/**
 * Returns the repository for the current context. Milestone 1 is guest-only,
 * so this is always the local repository. Milestone 2 will return the
 * Supabase repository for signed-in users and keep local for guests.
 */
export function getResetRepository(): ResetRepository {
  if (!localInstance) localInstance = new LocalResetRepository();
  return localInstance;
}

let localLoadInstance: LoadRepository | null = null;

/** Family Load persistence. Guest-only in Milestone 2A, same swap point as resets. */
export function getLoadRepository(): LoadRepository {
  if (!localLoadInstance) localLoadInstance = new LocalLoadRepository();
  return localLoadInstance;
}

let localDayNoteInstance: DayNoteRepository | null = null;

/** Evening closes. Guests keep them on the device; accounts sync them. */
export function getDayNoteRepository(): DayNoteRepository {
  if (!localDayNoteInstance) localDayNoteInstance = new LocalDayNoteRepository();
  return localDayNoteInstance;
}
