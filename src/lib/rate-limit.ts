/**
 * In-memory sliding-window rate limiter.
 *
 * Known limitations:
 * - State resets on every serverless cold start (Vercel spins up fresh instances).
 * - Each function instance has its own independent counter — concurrent instances
 *   do not share state, so the effective limit is per-instance, not global.
 * - Only per-IP limits are enforced; no per-user or per-session limits.
 *
 * This provides best-effort burst protection within a single warm instance.
 * For production-grade distributed rate limiting, migrate to Upstash Redis
 * (@upstash/ratelimit) or Vercel KV.
 */

interface SlidingWindow {
  timestamps: number[];
}

const store = new Map<string, SlidingWindow>();
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
      if (entry.timestamps.length === 0) store.delete(k);
    }
    lastCleanup = now;
  }

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldestInWindow + windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
  };
}
