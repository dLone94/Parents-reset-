import { z } from "zod";
import { cleanText, countCharacters } from "@/features/reset/schema";
import { dayWeather, journalLimits } from "@/types/journal";

const optionalText = (max: number) =>
  z
    .string()
    .transform(cleanText)
    .refine((v) => countCharacters(v) <= max, { message: "tooLong" })
    .optional();

/**
 * Everything is optional. A parent who taps only the weather has still closed
 * their day, and the app must not treat that as an unfinished form.
 */
export const dayNoteSchema = z.object({
  weather: z.enum(dayWeather).optional(),
  hard: optionalText(journalLimits.hardMax),
  kept: optionalText(journalLimits.keptMax),
  tomorrow: optionalText(journalLimits.tomorrowMax),
});

export type DayNoteInput = z.input<typeof dayNoteSchema>;
export type DayNoteParsed = z.output<typeof dayNoteSchema>;
