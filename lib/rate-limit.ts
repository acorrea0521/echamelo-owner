import "server-only";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

// Fixed-window in-memory rate limiter. Correct for a single Node process,
// which is what shared cPanel hosting runs; if the app is ever horizontally
// scaled, swap the Map for Redis/Upstash keyed the same way.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  // Opportunistic cleanup so the Map can't grow unbounded over a long uptime.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}
