import { z } from "zod";
import { cleanText, countCharacters } from "@/features/reset/schema";
import { loadCategories, loadLimits } from "@/types/load";

export const loadItemTitleSchema = z
  .string()
  .transform(cleanText)
  .refine((v) => countCharacters(v) > 0, { message: "required" })
  .refine((v) => countCharacters(v) <= loadLimits.titleMax, { message: "tooLong" });

export const newLoadItemSchema = z.object({
  category: z.enum(loadCategories),
  title: loadItemTitleSchema,
});

export type NewLoadItemInput = z.input<typeof newLoadItemSchema>;
