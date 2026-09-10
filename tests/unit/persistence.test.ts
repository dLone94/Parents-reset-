import { describe, expect, it } from "vitest";
import { DeterministicResetPlanner } from "@/features/reset/planner";
import { LocalResetRepository, LOCAL_RESETS_KEY } from "@/services/persistence";
import type { ResetRecord } from "@/types/reset";

function record(id: string, mustHappen = "Do one thing"): ResetRecord {
  const answers = { overwhelm: 6, areas: ["home" as const], time: "30to60" as const, moneyPressure: false, mustHappen };
  return {
    id,
    createdAt: new Date(2026, 0, 1).toISOString(),
    locale: "en",
    answers,
    plan: new DeterministicResetPlanner().plan(answers),
    safetyFlag: false,
  };
}

describe("LocalResetRepository (guest persistence)", () => {
  it("saves, reads, lists newest first, removes and clears", async () => {
    const repo = new LocalResetRepository(window.localStorage);
    await repo.save(record("a"));
    await repo.save(record("b", "ありがとう"));

    expect(await repo.get("a")).toMatchObject({ id: "a" });
    expect((await repo.get("b"))?.answers.mustHappen).toBe("ありがとう");
    expect((await repo.list()).map((r) => r.id)).toEqual(["b", "a"]);

    await repo.remove("a");
    expect(await repo.get("a")).toBeNull();

    await repo.clear();
    expect(await repo.list()).toEqual([]);
    expect(window.localStorage.getItem(LOCAL_RESETS_KEY)).toBeNull();
  });

  it("caps stored resets so personal data does not accumulate forever", async () => {
    const repo = new LocalResetRepository(window.localStorage);
    for (let i = 0; i < 25; i++) await repo.save(record(`r${i}`));
    expect(await repo.list()).toHaveLength(20);
    expect((await repo.list())[0].id).toBe("r24");
  });

  it("survives corrupted storage and missing storage", async () => {
    window.localStorage.setItem(LOCAL_RESETS_KEY, "{not json");
    const repo = new LocalResetRepository(window.localStorage);
    expect(await repo.list()).toEqual([]);
    const none = new LocalResetRepository(null);
    await none.save(record("x"));
    expect(await none.get("x")).toBeNull();
  });
});
