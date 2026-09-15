import { describe, expect, it } from "vitest";
import { closingKey } from "@/features/evening/closing";
import { dayNoteSchema } from "@/features/evening/schema";
import { isoWeekKey, returnsKey, summariseReturns } from "@/features/history/returns";
import { pickResurfaced } from "@/features/kept/resurface";
import { daysBetween, dayToDate, localDay } from "@/lib/utils/day";
import { isNightHour, resolveTheme } from "@/lib/theme";
import { LocalDayNoteRepository } from "@/services/persistence";
import { journalLimits, keptMoments, type DayNote } from "@/types/journal";

function note(day: string, extra: Partial<DayNote> = {}): DayNote {
  return {
    id: `n-${day}`,
    day,
    createdAt: `${day}T20:00:00.000Z`,
    updatedAt: `${day}T20:00:00.000Z`,
    locale: "en",
    ...extra,
  };
}

describe("local days", () => {
  it("uses the local calendar date, not UTC", () => {
    // 23:40 local on the 5th is still the 5th, whatever the timezone offset.
    const late = new Date(2026, 2, 5, 23, 40);
    expect(localDay(late)).toBe("2026-03-05");
  });

  it("measures whole days between day keys, including across a month", () => {
    expect(daysBetween("2026-03-01", "2026-03-08")).toBe(7);
    expect(daysBetween("2026-02-26", "2026-03-02")).toBe(4);
    expect(daysBetween("2026-03-08", "2026-03-01")).toBe(-7);
  });

  it("puts a day key at midday so formatting never slips a day", () => {
    expect(dayToDate("2026-03-05").getHours()).toBe(12);
  });
});

describe("evening close validation", () => {
  it("accepts a note with nothing but the weather", () => {
    const parsed = dayNoteSchema.safeParse({ weather: "rain" });
    expect(parsed.success).toBe(true);
  });

  it("accepts an entirely empty close", () => {
    expect(dayNoteSchema.safeParse({}).success).toBe(true);
  });

  it("rejects text past the limit, counted in code points", () => {
    const tooLong = "🌧".repeat(journalLimits.keptMax + 1);
    expect(dayNoteSchema.safeParse({ kept: tooLong }).success).toBe(false);
    const justFits = "🌧".repeat(journalLimits.keptMax);
    expect(dayNoteSchema.safeParse({ kept: justFits }).success).toBe(true);
  });
});

describe("closing line", () => {
  it("answers a storm before congratulating anyone on a habit", () => {
    const key = closingKey({
      weather: "storm",
      hasHard: true,
      hasKept: false,
      resetToday: true,
      closedInLastWeek: 6,
    });
    expect(key).toBe("storm");
  });

  it("notices a good moment inside a storm", () => {
    expect(
      closingKey({ weather: "storm", hasHard: true, hasKept: true, resetToday: false, closedInLastWeek: 1 }),
    ).toBe("stormKept");
  });

  it("falls back through kept, heard, reset and habit to plain", () => {
    const base = { hasHard: false, hasKept: false, resetToday: false, closedInLastWeek: 0 };
    expect(closingKey({ ...base, hasKept: true })).toBe("kept");
    expect(closingKey({ ...base, hasHard: true })).toBe("heard");
    expect(closingKey({ ...base, resetToday: true })).toBe("afterReset");
    expect(closingKey({ ...base, closedInLastWeek: 3 })).toBe("steady");
    expect(closingKey(base)).toBe("plain");
  });
});

describe("kept moments", () => {
  it("lifts only notes that actually kept something", () => {
    const moments = keptMoments([
      note("2026-03-01", { kept: "  she laughed  " }),
      note("2026-03-02", { kept: "   " }),
      note("2026-03-03", { hard: "long day" }),
    ]);
    expect(moments).toHaveLength(1);
    expect(moments[0].text).toBe("she laughed");
  });

  it("only resurfaces moments old enough to have been forgotten", () => {
    const moments = keptMoments([
      note("2026-03-09", { kept: "yesterday" }),
      note("2026-02-01", { kept: "weeks ago" }),
    ]);
    const picked = pickResurfaced(moments, "2026-03-10");
    expect(picked?.text).toBe("weeks ago");
  });

  it("returns nothing when everything is recent", () => {
    const moments = keptMoments([note("2026-03-09", { kept: "yesterday" })]);
    expect(pickResurfaced(moments, "2026-03-10")).toBeNull();
  });

  it("is stable within a day and can differ between days", () => {
    const moments = keptMoments(
      ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"].map((day) =>
        note(day, { kept: `moment ${day}` }),
      ),
    );
    const first = pickResurfaced(moments, "2026-03-10");
    expect(pickResurfaced(moments, "2026-03-10")?.id).toBe(first?.id);

    const picks = new Set(
      ["2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14"].map(
        (day) => pickResurfaced(moments, day)?.id,
      ),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("returns", () => {
  it("counts unique days and never resets after a gap", () => {
    const summary = summariseReturns(
      ["2026-03-01", "2026-03-01", "2026-03-02", "2026-03-20"],
      "2026-03-22",
    );
    expect(summary.total).toBe(3);
    expect(summary.longestGap).toBe(18);
    expect(summary.sinceLast).toBe(2);
    expect(summary.firstDay).toBe("2026-03-01");
    expect(summary.lastDay).toBe("2026-03-20");
  });

  it("counts only the last seven days as this week", () => {
    const summary = summariseReturns(["2026-03-16", "2026-03-18", "2026-03-01"], "2026-03-20");
    expect(summary.thisWeek).toBe(2);
  });

  it("welcomes someone back instead of scolding the gap", () => {
    const summary = summariseReturns(["2026-02-01", "2026-03-01"], "2026-03-20");
    expect(returnsKey(summary)).toBe("welcomeBack");
  });

  it("has a message for every stage, including none at all", () => {
    expect(returnsKey(summariseReturns([], "2026-03-20"))).toBe("none");
    expect(returnsKey(summariseReturns(["2026-03-20"], "2026-03-20"))).toBe("first");
    expect(
      returnsKey(summariseReturns(["2026-03-18", "2026-03-19", "2026-03-20"], "2026-03-20")),
    ).toBe("often");
    // Spread thinly over several weeks: fewer than three days in the last
    // seven, so the message is about the weeks rather than the week.
    expect(returnsKey(summariseReturns(["2026-03-02", "2026-03-09", "2026-03-20"], "2026-03-20"))).toBe("weeks");
    expect(returnsKey(summariseReturns(["2026-03-19", "2026-03-20"], "2026-03-20"))).toBe("growing");
  });

  it("groups days into ISO weeks", () => {
    // Monday and Sunday of the same ISO week.
    expect(isoWeekKey("2026-03-16")).toBe(isoWeekKey("2026-03-22"));
    expect(isoWeekKey("2026-03-16")).not.toBe(isoWeekKey("2026-03-23"));
  });
});

describe("theme", () => {
  it("dims late in the evening even on a light phone", () => {
    expect(isNightHour(21)).toBe(true);
    expect(isNightHour(3)).toBe(true);
    expect(isNightHour(14)).toBe(false);
    expect(resolveTheme("auto", { prefersDark: false, hour: 22 })).toBe("dark");
    expect(resolveTheme("auto", { prefersDark: false, hour: 14 })).toBe("light");
    expect(resolveTheme("auto", { prefersDark: true, hour: 14 })).toBe("dark");
  });

  it("lets an explicit choice win in both directions", () => {
    expect(resolveTheme("light", { prefersDark: true, hour: 23 })).toBe("light");
    expect(resolveTheme("dark", { prefersDark: false, hour: 9 })).toBe("dark");
  });
});

describe("local day note repository", () => {
  it("keeps one note per day and returns the newest first", async () => {
    const repo = new LocalDayNoteRepository(window.localStorage);
    await repo.save(note("2026-03-01", { kept: "first" }));
    await repo.save(note("2026-03-02", { kept: "second" }));
    // Closing the same day again replaces rather than duplicates.
    await repo.save({ ...note("2026-03-01", { kept: "edited" }), id: "different-id" });

    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list[0].day).toBe("2026-03-02");
    expect((await repo.getByDay("2026-03-01"))?.kept).toBe("edited");
  });

  it("removes and clears", async () => {
    const repo = new LocalDayNoteRepository(window.localStorage);
    await repo.save(note("2026-03-01"));
    await repo.remove("n-2026-03-01");
    expect(await repo.list()).toEqual([]);

    await repo.save(note("2026-03-02"));
    await repo.clear();
    expect(await repo.list()).toEqual([]);
  });

  it("returns an empty list when storage is unavailable", async () => {
    const repo = new LocalDayNoteRepository(null);
    expect(await repo.list()).toEqual([]);
    await expect(repo.save(note("2026-03-01"))).resolves.toBeUndefined();
  });
});
