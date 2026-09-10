import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  loadLevel,
  loadScore,
  POSTPONE_HOURS,
  postponeUntil,
  scoresByCategory,
  sortForDisplay,
} from "@/features/load/logic";
import { loadItemTitleSchema, newLoadItemSchema } from "@/features/load/schema";
import { LocalLoadRepository, LOCAL_LOAD_KEY } from "@/services/persistence";
import { loadLimits, type LoadItem } from "@/types/load";

const NOW = new Date("2026-09-10T12:00:00Z");

function item(overrides: Partial<LoadItem> & { id: string }): LoadItem {
  return {
    category: "kids",
    title: overrides.id,
    status: "open",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe("Family Load logic", () => {
  it("treats a postponed item as open again once its time has passed", () => {
    const later = item({ id: "a", status: "postponed", postponedUntil: "2026-09-11T12:00:00Z" });
    expect(effectiveStatus(later, NOW)).toBe("postponed");
    expect(effectiveStatus(later, new Date("2026-09-11T12:00:00Z"))).toBe("open");
    expect(effectiveStatus(item({ id: "b", status: "done" }), NOW)).toBe("done");
  });

  it("postpones for one day", () => {
    const until = new Date(postponeUntil(NOW));
    expect((until.getTime() - NOW.getTime()) / 36e5).toBe(POSTPONE_HOURS);
  });

  it("scores open items fully and postponed items half", () => {
    const items = [
      item({ id: "1" }),
      item({ id: "2" }),
      item({ id: "3", status: "postponed", postponedUntil: "2026-09-11T12:00:00Z" }),
      item({ id: "4", status: "done" }),
      item({ id: "5", category: "money" }),
    ];
    expect(loadScore(items, "kids", NOW)).toBe(2.5);
    expect(loadScore(items, "money", NOW)).toBe(1);
    expect(loadScore(items, "home", NOW)).toBe(0);
  });

  it("maps scores to levels", () => {
    expect(loadLevel(0)).toBe("clear");
    expect(loadLevel(0.5)).toBe("light");
    expect(loadLevel(2)).toBe("light");
    expect(loadLevel(3)).toBe("busy");
    expect(loadLevel(4)).toBe("busy");
    expect(loadLevel(5)).toBe("heavy");
  });

  it("summarises every category, including empty ones", () => {
    const scores = scoresByCategory([item({ id: "1", category: "me" })], NOW);
    expect(Object.keys(scores)).toEqual(["kids", "money", "home", "work", "relationship", "me"]);
    expect(scores.me).toEqual({ score: 1, level: "light", open: 1 });
    expect(scores.work).toEqual({ score: 0, level: "clear", open: 0 });
  });

  it("sorts open before postponed before done, newest first within a group", () => {
    const sorted = sortForDisplay(
      [
        item({ id: "done", status: "done", updatedAt: "2026-09-10T13:00:00Z" }),
        item({ id: "old-open", updatedAt: "2026-09-10T10:00:00Z" }),
        item({ id: "later", status: "postponed", postponedUntil: "2026-09-11T12:00:00Z" }),
        item({ id: "new-open", updatedAt: "2026-09-10T11:00:00Z" }),
      ],
      NOW,
    );
    expect(sorted.map((i) => i.id)).toEqual(["new-open", "old-open", "later", "done"]);
  });
});

describe("Family Load validation", () => {
  it("requires a title and limits it by characters", () => {
    expect(loadItemTitleSchema.safeParse("   ").success).toBe(false);
    expect(loadItemTitleSchema.safeParse("Buy shoes").success).toBe(true);
    const cjk = "靴".repeat(loadLimits.titleMax);
    expect(loadItemTitleSchema.safeParse(cjk).success).toBe(true);
    expect(loadItemTitleSchema.safeParse(cjk + "子").success).toBe(false);
  });

  it("only accepts the six categories", () => {
    expect(newLoadItemSchema.safeParse({ category: "me", title: "Sleep" }).success).toBe(true);
    expect(newLoadItemSchema.safeParse({ category: "health", title: "Sleep" }).success).toBe(false);
  });
});

describe("LocalLoadRepository", () => {
  it("adds, lists newest first, updates, removes and clears", async () => {
    const repo = new LocalLoadRepository(window.localStorage);
    await repo.add(item({ id: "a", title: "Stromrechnung" }));
    await repo.add(item({ id: "b", title: "牙医预约", category: "kids" }));
    expect((await repo.list()).map((i) => i.id)).toEqual(["b", "a"]);

    const updated = await repo.update("a", { status: "done", completedAt: NOW.toISOString() });
    expect(updated?.status).toBe("done");
    expect((await repo.list()).find((i) => i.id === "a")?.completedAt).toBe(NOW.toISOString());
    expect(await repo.update("missing", { status: "done" })).toBeNull();

    await repo.remove("b");
    expect((await repo.list()).map((i) => i.id)).toEqual(["a"]);

    await repo.clear();
    expect(await repo.list()).toEqual([]);
    expect(window.localStorage.getItem(LOCAL_LOAD_KEY)).toBeNull();
  });

  it("caps stored items, dropping the oldest done items first", async () => {
    const repo = new LocalLoadRepository(window.localStorage);
    await repo.add(item({ id: "old-done", status: "done" }));
    for (let i = 0; i < loadLimits.maxItems; i++) await repo.add(item({ id: `open-${i}` }));
    const items = await repo.list();
    expect(items).toHaveLength(loadLimits.maxItems);
    expect(items.find((i) => i.id === "old-done")).toBeUndefined();
    expect(items[0].id).toBe(`open-${loadLimits.maxItems - 1}`);
  });

  it("survives corrupted or missing storage", async () => {
    window.localStorage.setItem(LOCAL_LOAD_KEY, "nope");
    expect(await new LocalLoadRepository(window.localStorage).list()).toEqual([]);
    const none = new LocalLoadRepository(null);
    await none.add(item({ id: "x" }));
    expect(await none.list()).toEqual([]);
  });
});
