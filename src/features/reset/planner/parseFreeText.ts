import { limits } from "@/types/reset";

/**
 * Splits free text into individual items. Works for languages without spaces
 * between words: we only split on line breaks and list punctuation
 * (Latin and CJK variants), never on whitespace.
 */
export function parseFreeText(input: string | undefined, max = limits.maxParsedItems): string[] {
  if (!input) return [];
  const parts = input
    .split(/[\n\r;；,，、。•]+/g)
    .map((part) => part.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((part) => part.length > 0);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
    if (unique.length >= max) break;
  }
  return unique;
}
