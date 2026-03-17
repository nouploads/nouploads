import { useState, useEffect, useRef } from 'react';

interface UseWasmLoaderOptions {
  url: string;
  name: string;
  autoLoad?: boolean;
}

interface UseWasmLoaderResult<T = unknown> {
  module: T | null;
  loading: boolean;
  progress: number;
  error: string | null;
  load: () => Promise<T>;
}

const moduleCache = new Map<string, unknown>();

export function useWasmLoader<T = unknown>({
  url,
  name,
  autoLoad = false,
}: UseWasmLoaderOptions): UseWasmLoaderResult<T> {
  const [module, setModule] = useState<T | null>(
    (moduleCache.get(name) as T) || null
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  async function load(): Promise<T> {
    if (moduleCache.has(name)) {
      const cached = moduleCache.get(name) as T;
      setModule(cached);
      return cached;
    }

    if (loadingRef.current) {
      return new Promise(() => {});
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${name}`);

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();

      if (!reader) throw new Error('Stream not available');

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setProgress((received / total) * 100);
        }
      }

      const blob = new Blob(chunks);
      const result = blob as unknown as T;

      moduleCache.set(name, result);
      setModule(result);
      setProgress(100);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to load ${name}`;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    if (autoLoad && !module && !loading) {
      load();
    }
  }, [autoLoad]);

  return { module, loading, progress, error, load };
}
