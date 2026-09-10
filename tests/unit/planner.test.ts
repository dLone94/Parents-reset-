import { describe, expect, it } from "vitest";
import { DeterministicResetPlanner, getResetPlanner, parseFreeText } from "@/features/reset/planner";
import type { ResetAnswers } from "@/types/reset";

const base: ResetAnswers = {
  overwhelm: 5,
  areas: ["kids"],
  time: "1to2h",
  moneyPressure: false,
  mustHappen: "Pay the electricity bill\nPick up the kids",
};

const planner = new DeterministicResetPlanner();

describe("DeterministicResetPlanner", () => {
  it("is the default planner behind the interface", () => {
    expect(getResetPlanner().name).toBe("deterministic-v1");
  });

  it("keeps the user's must-happen items verbatim in TODAY", () => {
    const plan = planner.plan(base);
    expect(plan.today.map((i) => i.text)).toEqual(["Pay the electricity bill", "Pick up the kids"]);
    expect(plan.today.every((i) => i.source === "user")).toBe(true);
  });

  it("never returns more than three TODAY items", () => {
    const plan = planner.plan({
      ...base,
      overwhelm: 9,
      moneyPressure: true,
      mustHappen: "a\nb\nc\nd\ne",
    });
    expect(plan.today).toHaveLength(3);
    expect(plan.today.map((i) => i.text)).toEqual(["a", "b", "c"]);
    const moved = plan.thisWeek.filter((i) => i.noteKey === "notes.movedForFocus");
    expect(moved.map((i) => i.text)).toEqual(["d", "e"]);
  });

  it("shrinks TODAY to two items when usable time is under 30 minutes", () => {
    const plan = planner.plan({ ...base, time: "under30", mustHappen: "a; b; c" });
    expect(plan.today).toHaveLength(2);
    expect(plan.thisWeek[0]).toMatchObject({ text: "c", noteKey: "notes.movedForTime" });
  });

  it("adds one concrete money step when money pressure is on", () => {
    const plan = planner.plan({ ...base, moneyPressure: true, mustHappen: "Call school" });
    expect(plan.today.map((i) => i.messageKey)).toContain("today.moneyCheck");
    expect(plan.letGo.map((i) => i.messageKey)).toContain("letGo.moneyWhole");
  });

  it("moves the money step to THIS WEEK when TODAY is full", () => {
    const plan = planner.plan({ ...base, moneyPressure: true, mustHappen: "a\nb\nc" });
    expect(plan.today.map((i) => i.messageKey)).not.toContain("today.moneyCheck");
    expect(plan.thisWeek.map((i) => i.messageKey)).toContain("today.moneyCheck");
  });

  it("adds a breather for high overwhelm when there is some time", () => {
    const plan = planner.plan({ ...base, overwhelm: 8, mustHappen: "One thing" });
    expect(plan.today.map((i) => i.messageKey)).toContain("today.breather");
    const tiny = planner.plan({ ...base, overwhelm: 8, time: "under30", mustHappen: "One thing" });
    expect(tiny.today.map((i) => i.messageKey)).not.toContain("today.breather");
  });

  it("gives every selected area a THIS WEEK item and matching permission in LET GO", () => {
    const plan = planner.plan({
      ...base,
      overwhelm: 7,
      areas: ["home", "relationship", "work"],
      mustHappen: "x",
    });
    expect(plan.thisWeek.map((i) => i.messageKey)).toEqual([
      "week.area.home",
      "week.area.relationship",
      "week.area.work",
    ]);
    expect(plan.letGo.map((i) => i.messageKey)).toEqual([
      "letGo.homePerfect",
      "letGo.relationshipTalk",
      "letGo.workExtra",
    ]);
  });

  it("keeps 'what else is on your mind' in the user's words, max two", () => {
    const plan = planner.plan({
      ...base,
      mustHappen: "x",
      onMind: "birthday party\nwork review\ncar noise",
    });
    const fromYou = plan.thisWeek.filter((i) => i.noteKey === "notes.fromYou");
    expect(fromYou.map((i) => i.text)).toEqual(["birthday party", "work review"]);
    expect(plan.letGo.map((i) => i.messageKey)).toContain("letGo.onMind");
  });

  it("picks summary and time keys from the answers", () => {
    expect(planner.plan({ ...base, overwhelm: 2 }).summaryKey).toBe("summary.calm");
    expect(planner.plan({ ...base, overwhelm: 5 }).summaryKey).toBe("summary.busy");
    expect(planner.plan({ ...base, overwhelm: 9 }).summaryKey).toBe("summary.heavy");
    expect(planner.plan({ ...base, time: "over2h" }).timeKey).toBe("time.over2h");
  });

  it("returns only translation keys or user text, never English sentences", () => {
    const plan = planner.plan({ ...base, overwhelm: 9, moneyPressure: true, areas: ["kids", "money", "home"] });
    for (const item of [...plan.today, ...plan.thisWeek, ...plan.letGo]) {
      if (item.source === "planner") {
        expect(item.messageKey).toMatch(/^[a-zA-Z]+\.[a-zA-Z.]+$/);
        expect(item.text).toBeUndefined();
      } else {
        expect(item.messageKey).toBeUndefined();
      }
    }
  });

  it("is deterministic", () => {
    const answers: ResetAnswers = { ...base, overwhelm: 8, moneyPressure: true, onMind: "a, b, c" };
    expect(planner.plan(answers)).toEqual(planner.plan(answers));
  });

  it("handles CJK input without needing spaces", () => {
    const plan = planner.plan({ ...base, mustHappen: "支付电费，接孩子。给牙医打电话" });
    expect(plan.today.map((i) => i.text)).toEqual(["支付电费", "接孩子", "给牙医打电话"]);
    const ja = planner.plan({ ...base, mustHappen: "電気代を払う、子どもを迎えに行く" });
    expect(ja.today.map((i) => i.text)).toEqual(["電気代を払う", "子どもを迎えに行く"]);
  });
});

describe("parseFreeText", () => {
  it("splits on new lines, semicolons, commas and CJK punctuation", () => {
    expect(parseFreeText("a\nb; c, d，e、f。g")).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
  it("strips list markers and dedupes case-insensitively", () => {
    expect(parseFreeText("- Laundry\n1. laundry\n* Dishes")).toEqual(["Laundry", "Dishes"]);
  });
  it("returns an empty list for empty input", () => {
    expect(parseFreeText(undefined)).toEqual([]);
    expect(parseFreeText("   ")).toEqual([]);
  });
});
