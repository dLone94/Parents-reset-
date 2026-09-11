import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(128);

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const displayNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  // Letters from any script, digits, spaces and a few friendly separators.
  .regex(/^[\p{L}\p{N} _.\-']+$/u);
