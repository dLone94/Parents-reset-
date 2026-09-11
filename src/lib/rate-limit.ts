/**
 * Minimal in-memory rate limiter for server actions.
 *
 * Plan: this protects a single instance against accidental loops and casual
 * abuse. Before scaling out, swap the store for a shared one (Upstash Redis,
 * Supabase table with TTL, or the hosting platform's edge rate limiting).
 * The interface is intentionally tiny so that swap is a one-file change.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Drops expired buckets so a long-running instance does not grow without bound. */
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now = Date.now(),
): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
