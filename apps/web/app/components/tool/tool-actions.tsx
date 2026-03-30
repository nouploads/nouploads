import { Download } from "lucide-react";
import { useCallback } from "react";
import { Button } from "~/components/ui/button";
import { formatFileSize } from "~/lib/utils";

interface DownloadButtonProps {
	blob: Blob;
	filename: string;
	label?: string;
}

export function DownloadButton({ blob, filename, label }: DownloadButtonProps) {
	const download = useCallback(() => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
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
