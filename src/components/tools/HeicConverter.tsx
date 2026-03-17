import { useState, useCallback } from 'react';
import { FileDropzone } from '../FileDropzone';
import { ProgressBar } from '../ProgressBar';
import { DownloadButton } from '../DownloadButton';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { heicToJpgBatch } from '../../processors/image/heic-to-jpg';
import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toJpgFilename(name: string): string {
  return name.replace(/\.heic$/i, '.jpg');
}

interface BatchResult {
  inputFile: File;
  output: Blob | Error;
}

export default function HeicConverter() {
  const [quality, setQuality] = useState(92);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setResults([]);
      setError(null);
      setStatus('processing');
      setProgress({ completed: 0, total: files.length });

      try {
        const outputs = await heicToJpgBatch(
          files,
          { quality: quality / 100 },
          (completedIndex, totalCount) => {
            setProgress({ completed: completedIndex + 1, total: totalCount });
          }
        );

        setResults(
          files.map((file, i) => ({ inputFile: file, output: outputs[i] }))
        );
        setStatus('done');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to convert files. Make sure they are valid HEIC images.'
        );
        setStatus('idle');
      }
    },
    [quality]
  );

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setStatus('idle');
    setProgress({ completed: 0, total: 0 });
  }, []);

  const successfulResults = results.filter(
    (r): r is BatchResult & { output: Blob } => r.output instanceof Blob
  );

  const downloadAll = useCallback(() => {
    for (const r of successfulResults) {
      const url = URL.createObjectURL(r.output);
      const a = document.createElement('a');
      a.href = url;
      a.download = toJpgFilename(r.inputFile.name);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [successfulResults]);

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
      {status === 'idle' && results.length === 0 && (
        <FileDropzone
          accept={{ 'image/heic': ['.heic', '.HEIC'] }}
          onFiles={handleFiles}
          multiple
        />
      )}

      {/* Processing */}
      {status === 'processing' && (
        <ProgressBar
          message={
            progress.total > 1
              ? `Converting ${progress.completed} of ${progress.total} files...`
              : 'Converting HEIC to JPG...'
          }
        />
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

      {/* Results */}
      {status === 'done' && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => {
            const isSuccess = r.output instanceof Blob;
            const outputName = toJpgFilename(r.inputFile.name);

            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-card p-3 gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{outputName}</p>
                    {isSuccess ? (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(r.inputFile.size)} → {formatFileSize((r.output as Blob).size)}
                        {' '}
                        {(r.output as Blob).size < r.inputFile.size ? (
                          <span className="text-primary font-medium">
                            ({Math.round((1 - (r.output as Blob).size / r.inputFile.size) * 100)}% smaller)
                          </span>
                        ) : (r.output as Blob).size > r.inputFile.size ? (
                          <span className="text-muted-foreground">
                            ({Math.round(((r.output as Blob).size / r.inputFile.size - 1) * 100)}% larger)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">(same size)</span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-destructive">
                        Failed: {(r.output as Error).message}
                      </p>
                    )}
                  </div>
                </div>
                {isSuccess && (
                  <DownloadButton
                    blob={r.output as Blob}
                    filename={outputName}
                  />
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-2">
            {successfulResults.length > 1 && (
              <Button onClick={downloadAll} className="gap-2">
                <Download className="h-4 w-4" />
                Download all ({successfulResults.length})
              </Button>
            )}
            <Button variant="outline" onClick={reset}>
              Convert more
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
