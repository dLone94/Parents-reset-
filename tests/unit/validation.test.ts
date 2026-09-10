import { describe, expect, it } from "vitest";
import { cleanText, countCharacters, resetAnswersSchema } from "@/features/reset/schema";
import { detectSafetyConcern } from "@/features/reset/safety";
import { moderateText } from "@/lib/moderation";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

const valid = {
  overwhelm: 7,
  areas: ["kids", "money"],
  time: "30to60",
  moneyPressure: true,
  mustHappen: "Pay rent",
};

const NUL = String.fromCharCode(0);

describe("resetAnswersSchema", () => {
  it("accepts a valid check-in and trims text", () => {
    const result = resetAnswersSchema.safeParse({ ...valid, mustHappen: "  Pay rent \n" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mustHappen).toBe("Pay rent");
  });

  it("rejects out-of-range overwhelm and unknown areas", () => {
    expect(resetAnswersSchema.safeParse({ ...valid, overwhelm: 0 }).success).toBe(false);
    expect(resetAnswersSchema.safeParse({ ...valid, overwhelm: 11 }).success).toBe(false);
    expect(resetAnswersSchema.safeParse({ ...valid, overwhelm: 5.5 }).success).toBe(false);
    expect(resetAnswersSchema.safeParse({ ...valid, areas: ["pets"] }).success).toBe(false);
    expect(resetAnswersSchema.safeParse({ ...valid, areas: [] }).success).toBe(false);
    expect(resetAnswersSchema.safeParse({ ...valid, time: "forever" }).success).toBe(false);
  });

  it("requires must-happen text", () => {
    const result = resetAnswersSchema.safeParse({ ...valid, mustHappen: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("required");
  });

  it("enforces length limits in characters, not bytes", () => {
    const cjk = "電".repeat(500);
    expect(countCharacters(cjk)).toBe(500);
    expect(resetAnswersSchema.safeParse({ ...valid, mustHappen: cjk }).success).toBe(true);
    expect(resetAnswersSchema.safeParse({ ...valid, mustHappen: cjk + "気" }).success).toBe(false);
    const emoji = "👩‍👧".repeat(10);
    expect(countCharacters(emoji)).toBeLessThan(emoji.length);
  });

  it("accepts optional on-mind text and strips control characters", () => {
    const result = resetAnswersSchema.safeParse({ ...valid, onMind: `hello${NUL}world` });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.onMind).toBe("helloworld");
    expect(cleanText("keep\nlines\tand tabs")).toBe("keep\nlines\tand tabs");
  });

  it("keeps Unicode text from every supported script intact", () => {
    for (const sample of ["Плащане на тока", "Zahnarzttermin für Mia", "Καλέστε το σχολείο", "牙医预约", "歯医者の予約", "Íoc an bille"]) {
      const result = resetAnswersSchema.safeParse({ ...valid, mustHappen: sample });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.mustHappen).toBe(sample);
    }
  });
});

describe("safety detection", () => {
  it("flags phrases that suggest immediate danger", () => {
    expect(detectSafetyConcern("I just want to end my life")).toBe(true);
    expect(detectSafetyConcern("Ich will nicht mehr leben")).toBe(true);
    expect(detectSafetyConcern("nu mai vreau să trăiesc")).toBe(true);
    expect(detectSafetyConcern("もう死にたい")).toBe(true);
    expect(detectSafetyConcern("Pay rent", "I am not safe at home")).toBe(true);
  });

  it("does not flag ordinary stress", () => {
    expect(detectSafetyConcern("I'm exhausted and the laundry is killing me")).toBe(false);
    expect(detectSafetyConcern("Ich bin total am Ende mit den Nerven")).toBe(false);
    expect(detectSafetyConcern("Kids, money, work. Everything at once.")).toBe(false);
    expect(detectSafetyConcern(undefined, "")).toBe(false);
  });
});

describe("moderation hook", () => {
  it("rejects empty and overlong text and link spam", () => {
    expect(moderateText("", { maxLength: 10 })).toEqual({ ok: false, reason: "empty" });
    expect(moderateText("", { maxLength: 10, allowEmpty: true })).toEqual({ ok: true });
    expect(moderateText("x".repeat(11), { maxLength: 10 })).toEqual({ ok: false, reason: "tooLong" });
    expect(moderateText("http://a.co http://b.co http://c.co", { maxLength: 100 })).toEqual({ ok: false, reason: "spam" });
    expect(moderateText("Call the dentist", { maxLength: 100 })).toEqual({ ok: true });
  });
});

describe("rate limit", () => {
  it("allows up to the limit within the window and then blocks", () => {
    resetRateLimits();
    const opts = { limit: 3, windowMs: 1000 };
    expect(rateLimit("ip", opts, 0).ok).toBe(true);
    expect(rateLimit("ip", opts, 10).ok).toBe(true);
    expect(rateLimit("ip", opts, 20).ok).toBe(true);
    const blocked = rateLimit("ip", opts, 30);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBe(970);
    expect(rateLimit("ip", opts, 1001).ok).toBe(true);
    expect(rateLimit("other", opts, 30).ok).toBe(true);
  });
});
