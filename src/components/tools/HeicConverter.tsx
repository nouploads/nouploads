import { useState, useCallback } from 'react';
import { FileDropzone } from '../FileDropzone';
import { ProgressBar } from '../ProgressBar';
import { DownloadButton } from '../DownloadButton';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { heicToJpg } from '../../processors/image/heic-to-jpg';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HeicConverter() {
  const [quality, setQuality] = useState(92);
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done'>('idle');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputFile, setInputFile] = useState<File | null>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      setInputFile(file);
      setResult(null);
      setError(null);
      setStatus('loading');

      try {
        // Dynamic import happens inside heicToJpg — first call loads the library
        setStatus('processing');
        const output = await heicToJpg(file, { quality: quality / 100 });
        setResult(output);
        setStatus('done');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to convert file. Make sure it is a valid HEIC image.'
        );
        setStatus('idle');
      }
    },
    [quality]
  );

  const reset = useCallback(() => {
    setInputFile(null);
    setResult(null);
    setError(null);
    setStatus('idle');
  }, []);

  const outputFilename = inputFile
    ? inputFile.name.replace(/\.heic$/i, '.jpg')
    : 'converted.jpg';

  return (
    <div className="space-y-6">
      {/* Quality setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          JPG Quality: {quality}%
        </label>
        <Slider
          value={quality}
          onValueChange={(v) => setQuality(typeof v === 'number' ? v : v[0])}
          min={10}
          max={100}
          step={1}
          className="max-w-sm"
        />
      </div>

      {/* File input */}
      {status === 'idle' && !result && (
        <FileDropzone
          accept={{ 'image/heic': ['.heic', '.HEIC'] }}
          onFiles={handleFiles}
        />
      )}

      {/* Loading / Processing */}
      {(status === 'loading' || status === 'processing') && (
        <ProgressBar message={status === 'loading' ? 'Loading converter...' : 'Converting HEIC to JPG...'} />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={reset} className="mt-2">
            Try again
          </Button>
        </div>
      )}

      {/* Result */}
      {result && inputFile && (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{inputFile.name}</p>
              <p className="text-muted-foreground">
                {formatFileSize(inputFile.size)} → {formatFileSize(result.size)}
                {' '}
                {result.size < inputFile.size ? (
                  <span className="text-primary font-medium">
                    ({Math.round((1 - result.size / inputFile.size) * 100)}% smaller)
                  </span>
                ) : result.size > inputFile.size ? (
                  <span className="text-muted-foreground">
                    ({Math.round((result.size / inputFile.size - 1) * 100)}% larger)
                  </span>
                ) : (
                  <span className="text-muted-foreground">(same size)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DownloadButton blob={result} filename={outputFilename} />
            <Button variant="outline" onClick={reset}>
              Convert another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
