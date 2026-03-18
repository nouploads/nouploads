import { useState, useRef, useCallback } from 'react';
import { FileInput } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FileDropzoneProps {
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSizeMB?: number;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  accept,
  multiple = false,
  maxSizeMB = 500,
  onFiles,
  disabled = false,
  children,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptExtensions = accept
    ? Object.values(accept).flat()
    : undefined;
  const acceptString = accept
    ? Object.keys(accept).join(',')
    : undefined;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);

      const files = Array.from(fileList);
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (const file of files) {
        if (file.size > maxBytes) {
          setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
          return;
        }
      }

      onFiles(multiple ? files : [files[0]]);
    },
    [maxSizeMB, multiple, onFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/40'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptString}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {children || (
          <>
            <FileInput className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium">
              Drop {multiple ? 'files' : 'a file'} here, or click to browse
            </p>
            {acceptExtensions && (
              <p className="text-xs text-muted-foreground mt-1">
                Accepted: {acceptExtensions.join(', ')}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Max {maxSizeMB}MB per file</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export { formatFileSize };
