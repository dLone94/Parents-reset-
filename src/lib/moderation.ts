/**
 * Content moderation hooks.
 *
 * V1 performs only cheap, deterministic checks. The hook signature is stable so
 * that community features can plug in a real moderation provider later
 * without changing call sites.
 */
export interface ModerationResult {
  ok: boolean;
  reason?: "empty" | "tooLong" | "spam";
}

const URL_PATTERN = /(https?:\/\/|www\.)\S+/gi;

export function moderateText(
  value: string,
  { maxLength, allowEmpty = false }: { maxLength: number; allowEmpty?: boolean },
): ModerationResult {
  const trimmed = value.trim();
  if (!trimmed) return allowEmpty ? { ok: true } : { ok: false, reason: "empty" };
  if (Array.from(trimmed).length > maxLength) return { ok: false, reason: "tooLong" };
  // Private reset text never needs links; more than a couple is almost always spam.
  const links = trimmed.match(URL_PATTERN)?.length ?? 0;
  if (links > 2) return { ok: false, reason: "spam" };
  return { ok: true };
}
