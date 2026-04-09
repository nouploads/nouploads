import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { removeImageBackground } from "~/features/image-tools/processors/remove-background";
import { formatFileSize } from "~/lib/utils";

const ACCEPT_RASTER: Record<string, string[]> = {
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/webp": [".webp"],
};

function toPngFilename(name: string): string {
	return name.replace(/\.[^.]+$/, ".png");
}

function progressMessage(progress: number | null): string {
	if (progress === null) return "Downloading AI model (first time only)...";
	if (progress === 0) return "Removing background...";
	return `Removing background... ${progress}%`;
}

// ─── Single-file mode: before/after compare slider ──────────

function SingleFileView({
	file,
	onReset,
}: {
	file: File;
	onReset: () => void;
}) {
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number | null>(null);
	const hasResult = resultUrl !== null;

	// Create original preview URL
	useEffect(() => {
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Process background removal
	useEffect(() => {
		const controller = new AbortController();
		setProcessing(true);
		setError(null);
		setProgress(null);

		(async () => {
			try {
				const result = await removeImageBackground(
					file,
					{ signal: controller.signal },
					(pct) => {
						if (controller.signal.aborted) return;
						setProgress(pct);
					},
				);
				if (controller.signal.aborted) return;
				setResultBlob(result.blob);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(result.blob);
				});
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Background removal failed",
				);
				setResultBlob(null);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return null;
				});
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file]);

	const outputFilename = toPngFilename(file.name);

	return (
		<div className="space-y-4">
			<div className="flex justify-between">
				<div>
					<p className="text-sm font-medium">Original</p>
					<p className="text-xs text-muted-foreground">
						{file.name} — {formatFileSize(file.size)}
					</p>
				</div>
				<div className="text-right">
					<p className="text-sm font-medium">Result</p>
					<p className="text-xs text-muted-foreground relative">
						<span
							className="inline-flex items-center gap-1.5 transition-opacity duration-300"
							style={{ opacity: processing ? 1 : 0 }}
						>
							{outputFilename} — <Spinner className="size-3 inline" />{" "}
							Processing...
						</span>
						{resultBlob && (
							<span
								className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
								style={{ opacity: processing ? 0 : 1 }}
							>
								{outputFilename} — {formatFileSize(resultBlob.size)}
							</span>
						)}
					</p>
				</div>
			</div>

			{processing && !hasResult ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-4">
					{originalUrl ? (
						<div className="relative h-full w-full">
							<img
								src={originalUrl}
								alt="Original"
								className="h-full w-full object-contain opacity-60"
							/>
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50">
								<ToolProgress
									value={progress ?? undefined}
									message={progressMessage(progress)}
								/>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center gap-2 p-4">
							<Spinner className="size-6" />
							<p className="text-sm text-muted-foreground">
								Loading preview...
							</p>
						</div>
					)}
				</div>
			) : error ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					<div className="flex flex-col items-center gap-2 p-4 text-center">
						<AlertCircle className="h-6 w-6 text-destructive" />
						<p className="text-sm text-destructive">{error}</p>
					</div>
				</div>
			) : originalUrl && resultUrl ? (
				<div className="relative">
					<div
						className="transition-opacity duration-300"
						style={{ opacity: processing ? 0.25 : 1 }}
					>
						<ImageCompareSlider
							originalSrc={originalUrl}
							resultSrc={resultUrl}
							height={400}
						/>
					</div>
					<div
						className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
						style={{ opacity: processing ? 1 : 0 }}
					>
						<Spinner className="size-10" />
					</div>
				</div>
			) : originalUrl ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					<img
						src={originalUrl}
						alt="Original"
						className="max-w-full max-h-full object-contain"
					/>
				</div>
			) : (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					<div className="flex flex-col items-center gap-2 p-4">
						<Spinner className="size-6" />
						<p className="text-sm text-muted-foreground">Loading preview...</p>
					</div>
				</div>
			)}

			<div className="flex items-center gap-3 h-9">
				{resultBlob && (
					<DownloadButton
						blob={resultBlob}
						filename={outputFilename}
						disabled={processing}
					/>
				)}
				<Button variant="outline" onClick={onReset}>
					Remove from another
				</Button>
			</div>
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────────

export default function RemoveBackgroundTool() {
	const [file, setFile] = useState<File | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) setFile(incoming[0]);
	}, []);

	const reset = useCallback(() => {
		setFile(null);
	}, []);

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_RASTER} onFiles={handleFiles} />
					</div>
				)}

				{file && <SingleFileView file={file} onReset={reset} />}
			</div>
		</div>
	);
}
