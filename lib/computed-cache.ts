// Cache for fully computed dashboard payloads. Google Sheets rows are cached in
// data-source.ts; this layer avoids repeating mapping, filtering and aggregation
// when the same page is revisited within its existing cache window.
import { unstable_cache } from "next/cache";

type ComputedCacheOptions = {
  key: string;
  label: string;
  ttlMs: number;
  forceRefresh?: boolean;
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const computedCache = new Map<string, CacheEntry<unknown>>();
const pendingComputations = new Map<string, Promise<unknown>>();

function revalidateSeconds(ttlMs: number) {
  return Math.max(1, Math.ceil(ttlMs / 1000));
}

export async function withComputedCache<T>(
  options: ComputedCacheOptions,
  compute: () => T | Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = computedCache.get(options.key) as CacheEntry<T> | undefined;

  if (!options.forceRefresh && cached && cached.expiresAt > now) {
    return cached.data;
  }

  const pendingKey = `${options.key}::${options.forceRefresh ? "refresh" : "cached"}`;
  const pending = pendingComputations.get(pendingKey) as Promise<T> | undefined;
  if (pending) return pending;

  const request = (async () => {
    const computeFresh = async () => {
      const startedAt = Date.now();
      const data = await compute();
      const elapsedMs = Date.now() - startedAt;
      const expiresAt = Date.now() + options.ttlMs;

      computedCache.set(options.key, { data, expiresAt });
      console.info(`[dashboard-perf] ${options.label}: agregado em ${elapsedMs}ms`);
      return data;
    };

    const data = options.forceRefresh
      ? await computeFresh()
      : await unstable_cache(computeFresh, ["dashboard-computed", options.key], {
          revalidate: revalidateSeconds(options.ttlMs)
        })();

    computedCache.set(options.key, {
      data,
      expiresAt: Date.now() + options.ttlMs
    });
    return data;
  })();

  pendingComputations.set(pendingKey, request);

  try {
    return await request;
  } finally {
    if (pendingComputations.get(pendingKey) === request) {
      pendingComputations.delete(pendingKey);
    }
  }
}
