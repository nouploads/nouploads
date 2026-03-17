import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileProcessor } from '../../../src/hooks/useFileProcessor';

describe('useFileProcessor', () => {
  it('should start with idle state', () => {
    const processor = vi.fn();
    const { result } = renderHook(() => useFileProcessor(processor));

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should set isProcessing to true while processing', async () => {
    let resolveProcessor: (value: string) => void;
    const processor = vi.fn(
      () => new Promise<string>((resolve) => { resolveProcessor = resolve; })
    );

    const { result } = renderHook(() => useFileProcessor(processor));
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });

    let processPromise: Promise<void>;
    act(() => {
      processPromise = result.current.processFile(file);
    });

    expect(result.current.isProcessing).toBe(true);

    await act(async () => {
      resolveProcessor!('done');
      await processPromise!;
    });

    expect(result.current.isProcessing).toBe(false);
  });

  it('should return result on success', async () => {
    const outputBlob = new Blob(['output'], { type: 'image/jpeg' });
    const processor = vi.fn().mockResolvedValue(outputBlob);

    const { result } = renderHook(() => useFileProcessor(processor));
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });

    await act(async () => {
      await result.current.processFile(file);
    });

    expect(result.current.result).toBe(outputBlob);
    expect(result.current.progress).toBe(100);
    expect(result.current.error).toBeNull();
  });

  it('should set error on failure', async () => {
    const processor = vi.fn().mockRejectedValue(new Error('Conversion failed'));

    const { result } = renderHook(() => useFileProcessor(processor));
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });

    await act(async () => {
      await result.current.processFile(file);
    });

    expect(result.current.error).toBe('Conversion failed');
    expect(result.current.result).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should use generic error message for non-Error throws', async () => {
    const processor = vi.fn().mockRejectedValue('string error');

    const { result } = renderHook(() => useFileProcessor(processor));
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });

    await act(async () => {
      await result.current.processFile(file);
    });

    expect(result.current.error).toBe('Processing failed. Please try again.');
  });

  it('should pass onProgress callback to processor', async () => {
    const processor = vi.fn(async (_file: File, onProgress?: (p: number) => void) => {
      onProgress?.(25);
      onProgress?.(50);
      onProgress?.(75);
      return 'done';
    });

    const { result } = renderHook(() => useFileProcessor(processor));
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });

    await act(async () => {
      await result.current.processFile(file);
    });

    // After completion, progress is set to 100
    expect(result.current.progress).toBe(100);
    // Processor received the file and callback
    expect(processor).toHaveBeenCalledWith(file, expect.any(Function));
  });

  it('should reset state', async () => {
    const processor = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() => useFileProcessor(processor));
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });

    await act(async () => {
      await result.current.processFile(file);
    });

    expect(result.current.result).toBe('result');

    act(() => {
      result.current.reset();
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should clear previous result when processing a new file', async () => {
    const processor = vi.fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    const { result } = renderHook(() => useFileProcessor(processor));
    const file1 = new File(['a'], 'a.heic', { type: 'image/heic' });
    const file2 = new File(['b'], 'b.heic', { type: 'image/heic' });

    await act(async () => {
      await result.current.processFile(file1);
    });
    expect(result.current.result).toBe('first');

    await act(async () => {
      await result.current.processFile(file2);
    });
    expect(result.current.result).toBe('second');
  });
});
