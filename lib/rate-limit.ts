import "server-only";

const WINDOW_MS = 60_000;
const MAX_HITS = 5;

const hits = new Map<string, number[]>();

export function rateLimit(key: string): {
  ok: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (arr.length >= MAX_HITS) {
    return {
      ok: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - arr[0])) / 1000),
    };
  }

  arr.push(now);
  hits.set(key, arr);
  return { ok: true };
}