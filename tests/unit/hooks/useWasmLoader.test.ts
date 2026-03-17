import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWasmLoader } from '../../../src/hooks/useWasmLoader';

// Helper to create a mock fetch response with streaming
function createMockFetchResponse(data: Uint8Array, contentLength?: number) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  return {
    ok: true,
    headers: new Headers(
      contentLength != null ? { 'content-length': String(contentLength) } : {}
    ),
    body: stream,
  } as Response;
}

describe('useWasmLoader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear the module cache between tests by re-importing
    // The cache is module-level, so we need to reset it
  });

  it('should start in idle state', () => {
    const { result } = renderHook(() =>
      useWasmLoader({ url: '/test.wasm', name: 'test' })
    );

    expect(result.current.module).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should load module and track progress', async () => {
    const data = new Uint8Array([1, 2, 3, 4]);
    const mockResponse = createMockFetchResponse(data, data.length);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useWasmLoader({ url: '/test.wasm', name: 'progress-test' })
    );

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.module).toBeInstanceOf(Blob);
    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBe(100);
    expect(result.current.error).toBeNull();
  });

  it('should set error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      headers: new Headers(),
    } as Response);

    const { result } = renderHook(() =>
      useWasmLoader({ url: '/bad.wasm', name: 'error-test' })
    );

    await act(async () => {
      try {
        await result.current.load();
      } catch {
        // expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to load error-test');
    expect(result.current.module).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should set error when stream is not available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers(),
      body: null,
    } as Response);

    const { result } = renderHook(() =>
      useWasmLoader({ url: '/test.wasm', name: 'no-stream-test' })
    );

    await act(async () => {
      try {
        await result.current.load();
      } catch {
        // expected to throw
      }
    });

    expect(result.current.error).toBe('Stream not available');
  });

  it('should cache module after first load', async () => {
    const data = new Uint8Array([1, 2, 3]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createMockFetchResponse(data, data.length)
    );

    const { result } = renderHook(() =>
      useWasmLoader({ url: '/cached.wasm', name: 'cache-test' })
    );

    await act(async () => {
      await result.current.load();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second load should use cache
    await act(async () => {
      await result.current.load();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should auto-load when autoLoad is true', async () => {
    const data = new Uint8Array([1]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createMockFetchResponse(data, data.length)
    );

    const { result } = renderHook(() =>
      useWasmLoader({ url: '/auto.wasm', name: 'auto-test', autoLoad: true })
    );

    // Wait for the auto-load effect to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.module).toBeInstanceOf(Blob);
  });
});
