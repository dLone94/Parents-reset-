import { DeterministicResetPlanner } from "./deterministicPlanner";
import type { ResetPlanner } from "./ResetPlanner";

export type { ResetPlanner } from "./ResetPlanner";
export { DeterministicResetPlanner } from "./deterministicPlanner";
export { parseFreeText } from "./parseFreeText";

/**
 * Single place to swap the planner implementation. When an AI planner is
 * introduced it can be selected here (for example behind an env flag) while
 * the deterministic planner stays as the fallback.
 */
export function getResetPlanner(): ResetPlanner {
  return new DeterministicResetPlanner();
}
