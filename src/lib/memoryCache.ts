// src/lib/memoryCache.ts
// Ultra-fast in-memory cache for database queries to eliminate network latency in dev/SSR

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export async function withMemoryCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.data;
  }

  const data = await fetcher();
  cache.set(key, {
    data,
    expiresAt: now + ttlSeconds * 1000,
  });

  return data;
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
