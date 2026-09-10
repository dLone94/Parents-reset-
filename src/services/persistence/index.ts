import { LocalResetRepository } from "./LocalResetRepository";
import type { ResetRepository } from "./ResetRepository";

export type { ResetRepository } from "./ResetRepository";
export { LocalResetRepository, LOCAL_RESETS_KEY } from "./LocalResetRepository";
export { SupabaseResetRepository } from "./SupabaseResetRepository";

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
