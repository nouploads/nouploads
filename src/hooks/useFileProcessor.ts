import { useState, useCallback } from 'react';

interface UseFileProcessorResult<TResult> {
  processFile: (file: File) => Promise<void>;
  progress: number;
  result: TResult | null;
  error: string | null;
  isProcessing: boolean;
  reset: () => void;
}

export function useFileProcessor<TResult>(
  processor: (file: File, onProgress?: (progress: number) => void) => Promise<TResult>
): UseFileProcessorResult<TResult> {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      setProgress(0);

      try {
        const output = await processor(file, setProgress);
        setResult(output);
        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [processor]
  );

  const reset = useCallback(() => {
    setProgress(0);
    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return { processFile, progress, result, error, isProcessing, reset };
}
