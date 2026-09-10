/** Tiny class name joiner. Keeps us dependency-free for a simple need. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
