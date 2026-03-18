import { useState, useCallback, useEffect, useRef } from 'react';
import { FileDropzone } from '../FileDropzone';
import { DownloadButton } from '../DownloadButton';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ProgressBar } from '../ProgressBar';
import { heicToJpg, heicToJpgBatch } from '../../processors/image/heic-to-jpg';
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

// ─── Single-file mode: side-by-side preview with reactive quality ───

function SingleFileView({
  file,
  quality,
  onReset,
}: {
  file: File;
  quality: number;
  onReset: () => void;
}) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalLoading, setOriginalLoading] = useState(true);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const convertRef = useRef(0); // track latest conversion to discard stale results

  // Convert HEIC to a displayable preview at full quality (browsers can't render HEIC natively)
  useEffect(() => {
    setOriginalLoading(true);
    heicToJpg(file, { quality: 1.0 })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setOriginalUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setOriginalLoading(false);
      })
      .catch(() => {
        setOriginalLoading(false);
      });
  }, [file]);

  // Convert whenever file or quality changes
  useEffect(() => {
    const id = ++convertRef.current;
    setConverting(true);
    setError(null);

    heicToJpg(file, { quality: quality / 100 })
      .then((blob) => {
        if (convertRef.current !== id) return; // stale
        setResultBlob(blob);
        setResultUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setConverting(false);
      })
      .catch((err) => {
        if (convertRef.current !== id) return;
        setError(err instanceof Error ? err.message : 'Conversion failed');
        setResultBlob(null);
        setResultUrl(null);
        setConverting(false);
      });
  }, [file, quality]);

  const outputFilename = toJpgFilename(file.name);

  return (
    <div className="space-y-4">
      {/* Side-by-side preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Original</p>
          <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[350px]">
            {originalLoading ? (
              <div className="flex flex-col items-center gap-2 p-4">
                <Spinner className="size-6" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            ) : originalUrl ? (
              <img
                src={originalUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground h-5">
            {file.name} — {formatFileSize(file.size)}
          </p>
        </div>

        {/* Result */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Result</p>
          <div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[350px]">
            {converting ? (
              <div className="flex flex-col items-center gap-2 p-4">
                <Spinner className="size-6" />
                <p className="text-sm text-muted-foreground">Converting HEIC to JPG...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : resultUrl ? (
              <img
                src={resultUrl}
                alt="Result"
                className="max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground h-5">
            {resultBlob && !converting ? (
              <>
                {outputFilename} — {formatFileSize(resultBlob.size)}
                {' '}
                {resultBlob.size < file.size ? (
                  <span className="text-primary font-medium">
                    ({Math.round((1 - resultBlob.size / file.size) * 100)}% smaller)
                  </span>
                ) : resultBlob.size > file.size ? (
                  <span>
                    ({Math.round((resultBlob.size / file.size - 1) * 100)}% larger)
                  </span>
                ) : (
                  <span>(same size)</span>
                )}
              </>
            ) : (
              <>&nbsp;</>
            )}
          </p>
        </div>
      </div>

      {/* Actions — always reserve space */}
      <div className="flex items-center gap-3 h-9">
        {resultBlob && !converting && (
          <DownloadButton blob={resultBlob} filename={outputFilename} />
        )}
        <Button variant="outline" onClick={onReset}>
          Convert more
        </Button>
      </div>
    </div>
  );
}

// ─── Multi-file batch mode ──────────────────────────────────────

function BatchView({
  files,
  quality,
  onReset,
}: {
  files: File[];
  quality: number;
  onReset: () => void;
}) {
  const [status, setStatus] = useState<'processing' | 'done'>('processing');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('processing');
    setResults([]);
    setProgress({ completed: 0, total: files.length });

    heicToJpgBatch(
      files,
      { quality: quality / 100 },
      (completedIndex, totalCount) => {
        setProgress({ completed: completedIndex + 1, total: totalCount });
      }
    )
      .then((outputs) => {
        setResults(files.map((file, i) => ({ inputFile: file, output: outputs[i] })));
        setStatus('done');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Batch conversion failed');
        setStatus('done');
      });
  }, [files, quality]);

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
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {status === 'processing' && (
        <ProgressBar
          message={`Converting ${progress.completed} of ${progress.total} files...`}
        />
      )}

      {status === 'done' && results.length > 0 && (
        <>
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
                  <DownloadButton blob={r.output as Blob} filename={outputName} />
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
            <Button variant="outline" onClick={onReset}>
              Convert more
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────

export default function HeicConverter() {
  const [quality, setQuality] = useState(92);
  const [files, setFiles] = useState<File[]>([]);

  const handleFiles = useCallback((incoming: File[]) => {
    if (incoming.length > 0) setFiles(incoming);
  }, []);

  const reset = useCallback(() => {
    setFiles([]);
  }, []);

  const isSingleFile = files.length === 1;
  const isBatch = files.length > 1;

  return (
    <div className="space-y-6">
      {/* Quality setting — always visible */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          JPG Quality: {quality}%
        </label>
        <Slider
          value={[quality]}
          onValueChange={(v) => setQuality(v[0])}
          min={10}
          max={100}
          step={1}
          className="max-w-sm"
        />
      </div>

      <div className="min-h-[460px]">
        {/* Dropzone — shown when no files loaded */}
        {files.length === 0 && (
          <div className="h-[460px] flex items-center">
            <FileDropzone
              accept={{ 'image/heic': ['.heic', '.HEIC'] }}
              onFiles={handleFiles}
              multiple
            />
          </div>
        )}

        {/* Single file: side-by-side preview with reactive quality */}
        {isSingleFile && (
          <SingleFileView file={files[0]} quality={quality} onReset={reset} />
        )}

        {/* Multiple files: batch list */}
        {isBatch && (
          <BatchView files={files} quality={quality} onReset={reset} />
        )}
      </div>
    </div>
  );
}
