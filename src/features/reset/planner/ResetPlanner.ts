import type { ResetAnswers, ResetPlan } from "@/types/reset";

/**
 * A ResetPlanner turns check-in answers into a plan with three buckets.
 *
 * The deterministic planner is the V1 implementation. A future AI planner can
 * implement the same interface (and may wrap the deterministic one as a
 * fallback) without touching the UI or persistence layers.
 */
export interface ResetPlanner {
  readonly name: string;
  plan(answers: ResetAnswers): Promise<ResetPlan> | ResetPlan;
}
