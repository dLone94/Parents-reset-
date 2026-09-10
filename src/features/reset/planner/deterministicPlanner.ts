import type { LoadArea, PlanItem, ResetAnswers, ResetPlan } from "@/types/reset";
import { parseFreeText } from "./parseFreeText";
import type { ResetPlanner } from "./ResetPlanner";

const MAX_TODAY = 3;
const MAX_WEEK = 5;
const MAX_LET_GO = 4;
const MAX_ON_MIND_THIS_WEEK = 2;

/**
 * Deterministic V1 planner.
 *
 * Rules (in order):
 * - "What absolutely needs to happen" is split into items. Up to 3 go to TODAY
 *   (2 if there is less than 30 minutes of usable time). Overflow moves to
 *   THIS WEEK with a note explaining why.
 * - If money pressure is part of today and there is room, one concrete money
 *   step is added to TODAY; otherwise it goes to THIS WEEK.
 * - If overwhelm is high and there is at least some time, a short breather is
 *   added to TODAY. Rest counts as an item on purpose.
 * - Every selected load area gets one gentle "this week" item.
 * - "What else is on your mind" is kept in the user's words (max 2) under
 *   THIS WEEK. Anything beyond that is acknowledged under LET IT GO.
 * - LET IT GO is filled from the selected areas with permission-style items.
 *
 * No diagnosis, no therapy language, no hard-coded English: every planner
 * generated item is a translation key.
 */
export class DeterministicResetPlanner implements ResetPlanner {
  readonly name = "deterministic-v1";

  plan(answers: ResetAnswers): ResetPlan {
    let counter = 0;
    const nextId = (bucket: string) => `${bucket}-${++counter}`;

    const today: PlanItem[] = [];
    const thisWeek: PlanItem[] = [];
    const letGo: PlanItem[] = [];

    const areas = uniqueAreas(answers.areas);
    const highOverwhelm = answers.overwhelm >= 7;
    const veryHighOverwhelm = answers.overwhelm >= 8;
    const tinyTime = answers.time === "under30";
    const todayCap = tinyTime ? 2 : MAX_TODAY;

    // 1. Must-happen items in the user's own words.
    const mustItems = parseFreeText(answers.mustHappen);
    mustItems.forEach((text, index) => {
      if (index < todayCap) {
        today.push({ id: nextId("today"), bucket: "today", source: "user", text });
      } else {
        thisWeek.push({
          id: nextId("week"),
          bucket: "thisWeek",
          source: "user",
          text,
          noteKey: tinyTime ? "notes.movedForTime" : "notes.movedForFocus",
        });
      }
    });

    // 2. Money pressure gets one concrete, bounded step.
    if (answers.moneyPressure) {
      const item: Omit<PlanItem, "id"> = {
        bucket: "today",
        source: "planner",
        messageKey: "today.moneyCheck",
        area: "money",
      };
      if (today.length < todayCap) {
        today.push({ ...item, id: nextId("today") });
      } else {
        thisWeek.push({ ...item, id: nextId("week"), bucket: "thisWeek" });
      }
    }

    // 3. Nothing concrete? Offer a single anchor instead of an empty list.
    if (today.length === 0) {
      today.push({
        id: nextId("today"),
        bucket: "today",
        source: "planner",
        messageKey: "today.pickOne",
      });
    }

    // 4. High overwhelm with some time: a breather counts as an item.
    if (highOverwhelm && !tinyTime && today.length < MAX_TODAY) {
      today.push({
        id: nextId("today"),
        bucket: "today",
        source: "planner",
        messageKey: "today.breather",
      });
    }

    // 5. One gentle weekly item per selected area.
    for (const area of areas) {
      if (thisWeek.length >= MAX_WEEK) break;
      if (area === "money" && answers.moneyPressure) continue; // already covered
      thisWeek.push({
        id: nextId("week"),
        bucket: "thisWeek",
        source: "planner",
        messageKey: `week.area.${area}`,
        area,
      });
    }

    // 6. "What else is on your mind" stays in the user's words.
    const onMindItems = parseFreeText(answers.onMind);
    onMindItems.slice(0, MAX_ON_MIND_THIS_WEEK).forEach((text) => {
      if (thisWeek.length >= MAX_WEEK) return;
      thisWeek.push({
        id: nextId("week"),
        bucket: "thisWeek",
        source: "user",
        text,
        noteKey: "notes.fromYou",
      });
    });
    if (onMindItems.length > MAX_ON_MIND_THIS_WEEK) {
      letGo.push({
        id: nextId("letgo"),
        bucket: "letGo",
        source: "planner",
        messageKey: "letGo.onMind",
      });
    }

    // 7. Permission to let things go, based on what is loud today.
    const letGoRules: Array<{ when: boolean; key: string; area?: LoadArea }> = [
      { when: areas.includes("home"), key: "letGo.homePerfect", area: "home" },
      {
        when: answers.moneyPressure || areas.includes("money"),
        key: "letGo.moneyWhole",
        area: "money",
      },
      {
        when: areas.includes("relationship") && answers.overwhelm >= 6,
        key: "letGo.relationshipTalk",
        area: "relationship",
      },
      { when: areas.includes("kids"), key: "letGo.kidsExtra", area: "kids" },
      { when: areas.includes("work"), key: "letGo.workExtra", area: "work" },
      {
        when: areas.includes("health"),
        key: "letGo.healthAllOrNothing",
        area: "health",
      },
      { when: veryHighOverwhelm, key: "letGo.everythingElse" },
    ];
    for (const rule of letGoRules) {
      if (letGo.length >= MAX_LET_GO) break;
      if (rule.when) {
        letGo.push({
          id: nextId("letgo"),
          bucket: "letGo",
          source: "planner",
          messageKey: rule.key,
          area: rule.area,
        });
      }
    }
    if (letGo.length === 0) {
      letGo.push({
        id: nextId("letgo"),
        bucket: "letGo",
        source: "planner",
        messageKey: "letGo.everythingElse",
      });
    }

    return {
      summaryKey: summaryFor(answers.overwhelm),
      timeKey: `time.${answers.time}`,
      today: today.slice(0, MAX_TODAY),
      thisWeek: thisWeek.slice(0, MAX_WEEK),
      letGo: letGo.slice(0, MAX_LET_GO),
    };
  }
}

function summaryFor(overwhelm: number): string {
  if (overwhelm <= 3) return "summary.calm";
  if (overwhelm <= 6) return "summary.busy";
  return "summary.heavy";
}

function uniqueAreas(areas: LoadArea[]): LoadArea[] {
  return Array.from(new Set(areas));
}
