/**
 * Minimal in-memory fixed-window rate limiter for public endpoints.
 *
 * NOTE: state lives in the module's process memory. On Vercel's serverless
 * runtime each instance has its own counters and cold starts reset them, so
 * this is best-effort throttling against naive spam — not a hard guarantee.
 * If we need durable, cross-instance limits later, back this with Vercel KV /
 * Upstash Redis behind the same `rateLimit()` signature.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Returns whether the action is allowed for `key`, and how long (ms) until the
 * window resets. Allows up to `limit` calls per `windowMs`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
