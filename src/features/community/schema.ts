import { z } from "zod";
import { cleanText, countCharacters } from "@/features/reset/schema";

export const communityCategories = [
  "toddlers",
  "school_age",
  "money_stress",
  "no_time",
  "relationships",
  "dads",
  "mums",
  "single_parents",
  "moving",
  "general",
] as const;
export type CommunityCategory = (typeof communityCategories)[number];

export const communityLimits = {
  titleMin: 3,
  titleMax: 140,
  bodyMax: 4000,
  commentMax: 2000,
} as const;

const bounded = (min: number, max: number) =>
  z
    .string()
    .transform(cleanText)
    .refine((v) => countCharacters(v) >= min, { message: "required" })
    .refine((v) => countCharacters(v) <= max, { message: "tooLong" });

export const newPostSchema = z.object({
  category: z.enum(communityCategories),
  title: bounded(communityLimits.titleMin, communityLimits.titleMax),
  body: bounded(1, communityLimits.bodyMax),
});

export const newCommentSchema = z.object({
  postId: z.string().uuid(),
  body: bounded(1, communityLimits.commentMax),
});

export const reportSchema = z.object({
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  reason: z.enum(["spam", "harmful", "personal_info", "other"]),
});

export function isCommunityCategory(value: unknown): value is CommunityCategory {
  return typeof value === "string" && (communityCategories as readonly string[]).includes(value);
}
