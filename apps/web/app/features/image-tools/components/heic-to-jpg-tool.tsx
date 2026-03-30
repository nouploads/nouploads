import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import {
	heicToJpg,
	heicToJpgBatch,
} from "~/features/image-tools/processors/heic-to-jpg";
import { ACCEPT_HEIC } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

function toJpgFilename(name: string): string {
	return name.replace(/\.heic$/i, ".jpg");
}

interface BatchResult {
	inputFile: File;
	output: Blob | Error;
}

// ─── Single-file mode: before/after compare slider ──────────

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
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [converting, setConverting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasResult = resultUrl !== null;

	// Convert HEIC to a displayable preview at full quality (lossless reference)
	useEffect(() => {
		const controller = new AbortController();

		(async () => {
			try {
				const blob = await heicToJpg(file, {
					quality: 1.0,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setOriginalUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(blob);
				});
			} catch {
				// Preview unavailable or aborted
			}
		})();

		return () => controller.abort();
	}, [file]);

	// Convert whenever file or quality changes
	useEffect(() => {
		const controller = new AbortController();
		setConverting(true);
		setError(null);

		(async () => {
			try {
				const blob = await heicToJpg(file, {
					quality: quality / 100,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setResultBlob(blob);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(blob);
				});
				setConverting(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Conversion failed");
				setResultBlob(null);
				setResultUrl(null);
				setConverting(false);
			}
		})();

		return () => controller.abort();
	}, [file, quality]);

	const outputFilename = toJpgFilename(file.name);

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
							style={{ opacity: converting ? 1 : 0 }}
						>
							{outputFilename} — <Spinner className="size-3 inline" />{" "}
							Converting...
						</span>
						{resultBlob && (
							<span
								className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
								style={{ opacity: converting ? 0 : 1 }}
							>
								{outputFilename} — {formatFileSize(resultBlob.size)}{" "}
								{resultBlob.size < file.size ? (
									<span className="text-primary font-medium">
										({Math.round((1 - resultBlob.size / file.size) * 100)}%
										smaller)
									</span>
								) : resultBlob.size > file.size ? (
									<span>
										({Math.round((resultBlob.size / file.size - 1) * 100)}%
										larger)
									</span>
								) : (
									<span>(same size)</span>
								)}
							</span>
						)}
					</p>
				</div>
			</div>

			{converting && !hasResult ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					{originalUrl ? (
						<div className="relative h-full w-full">
							<img
								src={originalUrl}
								alt="Original"
								className="h-full w-full object-contain opacity-60"
							/>
							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50">
								<Spinner className="size-6" />
								<p className="text-sm text-muted-foreground">
									Loading preview...
								</p>
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
						style={{ opacity: converting ? 0.25 : 1 }}
					>
						<ImageCompareSlider
							originalSrc={originalUrl}
							resultSrc={resultUrl}
							height={400}
						/>
					</div>
					<div
						className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
						style={{ opacity: converting ? 1 : 0 }}
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
	const [status, setStatus] = useState<"processing" | "done">("processing");
	const [results, setResults] = useState<BatchResult[]>([]);
	const [progress, setProgress] = useState({ completed: 0, total: 0 });
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		setStatus("processing");
		setResults([]);
		setProgress({ completed: 0, total: files.length });

		(async () => {
			try {
				const outputs = await heicToJpgBatch(
					files,
					{ quality: quality / 100, signal: controller.signal },
					(completedIndex, totalCount) => {
						setProgress({
							completed: completedIndex + 1,
							total: totalCount,
						});
					},
				);
				if (controller.signal.aborted) return;
				setResults(
					files.map((file, i) => ({ inputFile: file, output: outputs[i] })),
				);
				setStatus("done");
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Batch conversion failed",
				);
				setStatus("done");
			}
		})();

		return () => controller.abort();
	}, [files, quality]);

	const successfulResults = results.filter(
		(r): r is BatchResult & { output: Blob } => r.output instanceof Blob,
	);

	const downloadAll = useCallback(() => {
		for (const r of successfulResults) {
			const url = URL.createObjectURL(r.output);
			const a = document.createElement("a");
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

			{status === "processing" && (
				<ToolProgress
					message={`Converting ${progress.completed} of ${progress.total} files...`}
				/>
			)}

			{status === "done" && results.length > 0 && (
				<>
					{results.map((r, i) => {
						const isSuccess = r.output instanceof Blob;
						const outputName = toJpgFilename(r.inputFile.name);

						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: batch results are append-only, never reordered
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
												{formatFileSize(r.inputFile.size)} &rarr;{" "}
												{formatFileSize((r.output as Blob).size)}{" "}
												{(r.output as Blob).size < r.inputFile.size ? (
													<span className="text-primary font-medium">
														(
														{Math.round(
															(1 - (r.output as Blob).size / r.inputFile.size) *
																100,
														)}
														% smaller)
													</span>
												) : (r.output as Blob).size > r.inputFile.size ? (
													<span className="text-muted-foreground">
														(
														{Math.round(
															((r.output as Blob).size / r.inputFile.size - 1) *
																100,
														)}
														% larger)
													</span>
												) : (
													<span className="text-muted-foreground">
														(same size)
													</span>
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

export default function HeicToJpgTool() {
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
			<div className="space-y-2">
				<span className="text-sm font-medium">JPG Quality: {quality}%</span>
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
				{files.length === 0 && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_HEIC} onFiles={handleFiles} multiple />
					</div>
				)}

				{isSingleFile && (
					<SingleFileView file={files[0]} quality={quality} onReset={reset} />
				)}

				{isBatch && (
					<BatchView files={files} quality={quality} onReset={reset} />
				)}
			</div>
		</div>
	);
}
