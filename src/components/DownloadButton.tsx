import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadButtonProps {
  blob: Blob;
  filename: string;
  label?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadButton({ blob, filename, label }: DownloadButtonProps) {
  const download = useCallback(() => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [blob, filename]);

  return (
    <Button onClick={download} className="gap-2">
      <Download className="h-4 w-4" />
      {label || `Download (${formatFileSize(blob.size)})`}
    </Button>
  );
}
