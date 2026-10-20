/**
 * Rate limit login di memori proses (aplikasi ini berjalan 1 instance, tanpa Redis).
 * Kalau nanti di-scale > 1 instance, pindahkan ke Redis/DB.
 */
const buckets = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX = 8;

export function hitLoginLimit(key: string): { blocked: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { n: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return { blocked: false, retryAfterSec: 0 };
  }
  b.n++;
  return { blocked: b.n > MAX, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
}

export const clearLoginLimit = (key: string) => buckets.delete(key);
