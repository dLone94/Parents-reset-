import { z } from "zod";
import { limits, loadAreas, timeOptions } from "@/types/reset";

/** Counts user-perceived characters, so CJK text is not penalised. */
export function countCharacters(value: string): number {
  return Array.from(value).length;
}

/**
 * Removes ASCII control characters (except tab, newline and carriage return)
 * while keeping every Unicode letter, including CJK and combining marks.
 */
export function cleanText(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    const isControl = (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
    if (!isControl) out += ch;
  }
  return out.trim();
}

const requiredText = (max: number) =>
  z
    .string()
    .transform(cleanText)
    .refine((v) => countCharacters(v) <= max, { message: "tooLong" })
    .refine((v) => countCharacters(v) > 0, { message: "required" });

const optionalText = (max: number) =>
  z
    .string()
    .transform(cleanText)
    .refine((v) => countCharacters(v) <= max, { message: "tooLong" })
    .optional();

export const resetAnswersSchema = z.object({
  overwhelm: z.number().int().min(1).max(10),
  areas: z.array(z.enum(loadAreas)).min(1).max(loadAreas.length),
  time: z.enum(timeOptions),
  moneyPressure: z.boolean(),
  mustHappen: requiredText(limits.mustHappenMax),
  onMind: optionalText(limits.onMindMax),
});

export type ResetAnswersInput = z.input<typeof resetAnswersSchema>;
export type ResetAnswersParsed = z.output<typeof resetAnswersSchema>;
