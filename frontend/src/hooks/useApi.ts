import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30000;

interface UseApiOptions {
  cache?: boolean;
  cacheTTL?: number;
  enabled?: boolean;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {},
) {
  const { cache: useCache = true, cacheTTL = CACHE_TTL, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    const cacheKey = fetcher.toString() + JSON.stringify(deps);

    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
        if (useCache) {
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || 'Error al cargar datos');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  const refresh = useCallback(() => {
    const cacheKey = fetcher.toString() + JSON.stringify(deps);
    cache.delete(cacheKey);
    execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { data, loading, error, refresh };
}
