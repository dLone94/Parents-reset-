"use server";

import { headers } from "next/headers";
import { moderateText } from "@/lib/moderation";
import { rateLimit } from "@/lib/rate-limit";
import { limits, type ResetPlan } from "@/types/reset";
import { getResetPlanner } from "./planner";
import { detectSafetyConcern } from "./safety";
import { resetAnswersSchema, type ResetAnswersParsed } from "./schema";

export type SubmitResetResult =
  | { ok: true; answers: ResetAnswersParsed; plan: ResetPlan; safetyFlag: boolean }
  | { ok: false; error: "invalid" | "rateLimited" | "rejected"; fields?: Record<string, string> };

/**
 * Validates the check-in on the server and runs the planner. The client keeps
 * ownership of persistence (local for guests), so no personal data is stored
 * here. Nothing is logged.
 */
export async function submitReset(input: unknown): Promise<SubmitResetResult> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";
  const limited = rateLimit(`reset:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) return { ok: false, error: "rateLimited" };

  const parsed = resetAnswersSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      if (!fields[field]) fields[field] = issue.message;
    }
    return { ok: false, error: "invalid", fields };
  }

  const answers = parsed.data;
  const must = moderateText(answers.mustHappen, { maxLength: limits.mustHappenMax });
  const onMind = moderateText(answers.onMind ?? "", {
    maxLength: limits.onMindMax,
    allowEmpty: true,
  });
  if (!must.ok || !onMind.ok) return { ok: false, error: "rejected" };

  const plan = await getResetPlanner().plan(answers);
  const safetyFlag = detectSafetyConcern(answers.mustHappen, answers.onMind);
  return { ok: true, answers, plan, safetyFlag };
}
