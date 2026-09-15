import { describe, expect, it } from "vitest";
import { credentialsSchema, displayNameSchema } from "@/features/account/schema";
import { generatePseudonym } from "@/features/account/pseudonym";
import { formatRelative } from "@/features/community/components/RelativeTime";
import { communityLimits, isCommunityCategory, newCommentSchema, newPostSchema, reportSchema } from "@/features/community/schema";
import { completionRatio, summariseHistory } from "@/features/history/summarise";
import { areaToLoadCategory } from "@/features/reset/loadBridge";
import { DeterministicResetPlanner } from "@/features/reset/planner";
import type { ResetRecord } from "@/types/reset";

function record(overrides: Partial<ResetRecord> & { overwhelm: number; createdAt: string; areas?: ResetRecord["answers"]["areas"] }): ResetRecord {
  const answers = { overwhelm: overrides.overwhelm, areas: overrides.areas ?? ["kids" as const], time: "1to2h" as const, moneyPressure: false, mustHappen: "a\nb\nc" };
  return {
    id: overrides.id ?? overrides.createdAt,
    createdAt: overrides.createdAt,
    locale: "en",
    answers,
    plan: new DeterministicResetPlanner().plan(answers),
    safetyFlag: false,
    completedItemIds: overrides.completedItemIds,
  };
}

describe("account validation", () => {
  it("normalises emails and enforces password length", () => {
    const ok = credentialsSchema.safeParse({ email: " Mum@Example.com ", password: "longenough" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("mum@example.com");
    expect(credentialsSchema.safeParse({ email: "nope", password: "longenough" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
  });

  it("accepts display names in any script and rejects symbols", () => {
    expect(displayNameSchema.safeParse("Ruhiger Otter 42").success).toBe(true);
    expect(displayNameSchema.safeParse("静かなカワウソ").success).toBe(true);
    expect(displayNameSchema.safeParse("Тиха Видра").success).toBe(true);
    expect(displayNameSchema.safeParse("<script>").success).toBe(false);
    expect(displayNameSchema.safeParse("x").success).toBe(false);
  });

  it("generates readable pseudonyms deterministically from a random source", () => {
    const name = generatePseudonym(() => 0);
    expect(name).toBe("Quiet Otter 10");
    expect(generatePseudonym(() => 0.999)).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ 99$/);
    expect(displayNameSchema.safeParse(generatePseudonym()).success).toBe(true);
  });
});

describe("history summary", () => {
  it("reports counts, recent average, comparison and frequent areas", () => {
    const records = [
      record({ overwhelm: 9, createdAt: "2026-09-01T10:00:00Z", areas: ["kids", "money"] }),
      record({ overwhelm: 8, createdAt: "2026-09-02T10:00:00Z", areas: ["kids"] }),
      record({ overwhelm: 8, createdAt: "2026-09-03T10:00:00Z", areas: ["home"] }),
      record({ overwhelm: 7, createdAt: "2026-09-04T10:00:00Z", areas: ["kids"] }),
      record({ overwhelm: 7, createdAt: "2026-09-05T10:00:00Z", areas: ["money"] }),
      record({ overwhelm: 6, createdAt: "2026-09-06T10:00:00Z", areas: ["kids"] }),
      record({ overwhelm: 6, createdAt: "2026-09-07T10:00:00Z", areas: ["work"] }),
      record({ overwhelm: 5, createdAt: "2026-09-08T10:00:00Z", areas: ["kids"] }),
      record({ overwhelm: 4, createdAt: "2026-09-09T10:00:00Z", areas: ["money"] }),
      record({ overwhelm: 4, createdAt: "2026-09-10T10:00:00Z", areas: ["kids"] }),
    ];
    const summary = summariseHistory(records);
    expect(summary.count).toBe(10);
    expect(summary.recentAverage).toBe(5.6);
    expect(summary.earlierAverage).toBe(8.3);
    expect(summary.frequentAreas).toEqual(["kids", "money", "home"]);
    expect(summary.trend).toEqual([9, 8, 8, 7, 7, 6, 6, 5, 4, 4]);
  });

  it("handles empty history and unordered input", () => {
    expect(summariseHistory([])).toEqual({ count: 0, recentAverage: null, earlierAverage: null, frequentAreas: [], trend: [] });
    const summary = summariseHistory([
      record({ overwhelm: 2, createdAt: "2026-09-02T10:00:00Z" }),
      record({ overwhelm: 8, createdAt: "2026-09-01T10:00:00Z" }),
    ]);
    expect(summary.trend).toEqual([8, 2]);
    expect(summary.earlierAverage).toBeNull();
  });

  it("computes completion of today items", () => {
    const r = record({ overwhelm: 5, createdAt: "2026-09-10T10:00:00Z" });
    expect(completionRatio(r)).toBe(0);
    const ids = r.plan.today.map((i) => i.id);
    expect(completionRatio({ ...r, completedItemIds: [ids[0], "stale-id"] })).toBeCloseTo(1 / 3);
    expect(completionRatio({ ...r, completedItemIds: ids })).toBe(1);
    expect(completionRatio({ ...r, plan: { ...r.plan, today: [] } })).toBeNull();
  });
});

describe("community validation", () => {
  it("validates posts with character limits and known categories", () => {
    expect(newPostSchema.safeParse({ category: "dads", title: "Hi there", body: "Some text" }).success).toBe(true);
    expect(newPostSchema.safeParse({ category: "pets", title: "Hi there", body: "x" }).success).toBe(false);
    expect(newPostSchema.safeParse({ category: "dads", title: "Hi", body: "x" }).success).toBe(false);
    const longTitle = "字".repeat(communityLimits.titleMax + 1);
    const result = newPostSchema.safeParse({ category: "dads", title: longTitle, body: "x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("tooLong");
    expect(newPostSchema.safeParse({ category: "dads", title: "字".repeat(communityLimits.titleMax), body: "x" }).success).toBe(true);
  });

  it("validates comments and reports", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(newCommentSchema.safeParse({ postId: id, body: "  kind words  " }).success).toBe(true);
    expect(newCommentSchema.safeParse({ postId: "nope", body: "kind words" }).success).toBe(false);
    expect(newCommentSchema.safeParse({ postId: id, body: "   " }).success).toBe(false);
    expect(reportSchema.safeParse({ postId: id, reason: "spam" }).success).toBe(true);
    expect(reportSchema.safeParse({ postId: id, reason: "boring" }).success).toBe(false);
    expect(isCommunityCategory("mums")).toBe(true);
    expect(isCommunityCategory("MUMS")).toBe(false);
  });
});

describe("relative time", () => {
  it("formats per locale", () => {
    const now = Date.UTC(2026, 8, 10, 12, 0, 0);
    expect(formatRelative(new Date(now - 30_000).toISOString(), now, "en")).toBe("30 seconds ago");
    expect(formatRelative(new Date(now - 3 * 3600_000).toISOString(), now, "en")).toBe("3 hours ago");
    expect(formatRelative(new Date(now - 86400_000).toISOString(), now, "en")).toBe("yesterday");
    expect(formatRelative(new Date(now - 2 * 86400_000).toISOString(), now, "de")).toBe("vorgestern");
    expect(formatRelative(new Date(now - 60 * 86400_000).toISOString(), now, "ja")).toBe("2 か月前");
  });
});

describe("plan item to family load area", () => {
  it("maps reset areas onto load categories", () => {
    expect(areaToLoadCategory("kids")).toBe("kids");
    expect(areaToLoadCategory("health")).toBe("me");
    expect(areaToLoadCategory("other")).toBe("me");
    expect(areaToLoadCategory(undefined)).toBe("me");
  });
});
