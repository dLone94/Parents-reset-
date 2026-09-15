import { describe, expect, it } from "vitest";
import {
  breathPatterns,
  cycleDuration,
  patternDuration,
  positionAt,
  ringScale,
} from "@/features/pause/patterns";
import { pausesOnDay, readPauses, recordPause } from "@/features/pause/log";
import { localDay } from "@/lib/utils/day";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("breathing patterns", () => {
  it("every pattern lands close to a minute", () => {
    for (const pattern of Object.values(breathPatterns)) {
      const total = patternDuration(pattern);
      expect(total).toBeGreaterThanOrEqual(50);
      expect(total).toBeLessThanOrEqual(70);
    }
  });

  it("walks through the phases of a cycle in order", () => {
    const settle = breathPatterns.settle; // 4 in, 6 out
    expect(cycleDuration(settle)).toBe(10);

    expect(positionAt(settle, 0).phase.kind).toBe("in");
    expect(positionAt(settle, 3.9).phase.kind).toBe("in");
    expect(positionAt(settle, 4).phase.kind).toBe("out");
    expect(positionAt(settle, 9.9).phase.kind).toBe("out");
    // Next cycle starts again on the inhale.
    expect(positionAt(settle, 10).phase.kind).toBe("in");
    expect(positionAt(settle, 10).cycle).toBe(2);
  });

  it("counts the seconds left in a phase down to one", () => {
    const settle = breathPatterns.settle;
    expect(positionAt(settle, 0).secondsLeft).toBe(4);
    expect(positionAt(settle, 3.2).secondsLeft).toBe(1);
    expect(positionAt(settle, 4).secondsLeft).toBe(6);
  });

  it("reports finished once every cycle is done, and clamps beyond the end", () => {
    const sleep = breathPatterns.sleep;
    const total = patternDuration(sleep);
    expect(positionAt(sleep, total - 0.1).finished).toBe(false);
    expect(positionAt(sleep, total).finished).toBe(true);
    expect(positionAt(sleep, total + 500).finished).toBe(true);
    expect(positionAt(sleep, total).cycle).toBe(sleep.cycles);
  });

  it("never goes backwards in time before the start", () => {
    expect(positionAt(breathPatterns.steady, -10).phase.kind).toBe("in");
  });

  it("opens the ring on the inhale and closes it on the exhale", () => {
    expect(ringScale("in")).toBeGreaterThan(ringScale("out"));
    expect(ringScale("hold")).toBe(ringScale("in"));
    expect(ringScale("rest")).toBe(ringScale("out"));
  });
});

describe("pause log", () => {
  it("records pauses newest first and counts today's", () => {
    const storage = memoryStorage();
    const today = new Date("2026-03-10T21:30:00Z");
    recordPause(new Date("2026-03-09T20:00:00Z"), storage);
    recordPause(today, storage);

    const entries = readPauses(storage);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toBe(today.toISOString());
    expect(pausesOnDay(entries, localDay(today))).toBe(1);
  });

  it("survives unreadable storage", () => {
    const broken = {
      getItem: () => "not json",
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readPauses(broken)).toEqual([]);
    expect(() => recordPause(new Date(), broken)).not.toThrow();
  });
});
