import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FrameScrubber } from "~/components/tool/frame-scrubber";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { formatFileSize } from "~/lib/utils";
import {
	type GifFrameData,
	parseGifFrames,
	revokeGifFrameUrls,
} from "../processors/parse-gif-frames";

interface CompressResult {
	blob: Blob;
	width: number;
	height: number;
}

export interface CompressFormatConfig {
	/** Accept filter shown in the dropzone UI, e.g. {"image/jpeg": [".jpg", ".jpeg"]} */
	accept: Record<string, string[]>;
	/** Target MIME for this page, e.g. "image/jpeg" */
	outputMime: string;
	/** File extension for downloads, e.g. ".jpg" */
	fileExtension: string;
	/** Slider configuration */
	sliderDefault: number;
	sliderMin: number;
	sliderMax: number;
	sliderStep: number;
	sliderLabel: (value: number) => string;
	/** Compress a single file. The slider value is passed as-is. */
	compress: (
		input: Blob,
		sliderValue: number,
		signal?: AbortSignal,
	) => Promise<CompressResult>;
	/** Compress a batch of files. */
	compressBatch: (
		inputs: Blob[],
		sliderValue: number,
		onProgress?: (completedIndex: number, totalCount: number) => void,
		signal?: AbortSignal,
	) => Promise<(CompressResult | Error)[]>;
}

function toOutputFilename(name: string, ext: string): string {
	if (!ext) return name; // universal mode: keep original extension
	return name.replace(/\.[^.]+$/, ext);
}

interface BatchResult {
	inputFile: File;
	output: CompressResult | Error;
}

// ─── Single-file mode ───────────────────────────────────────

function SingleFileView({
	file,
	sliderValue,
	config,
	onReset,
}: {
	file: File;
	sliderValue: number;
	config: CompressFormatConfig;
	onReset: () => void;
}) {
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [converting, setConverting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasResult = resultUrl !== null;

	// ─── GIF frame scrubbing ─────────────────────────────────
	const isGif = file.type === "image/gif";
	const [originalFrames, setOriginalFrames] = useState<GifFrameData | null>(
		null,
	);
	const [resultFrames, setResultFrames] = useState<GifFrameData | null>(null);
	const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
	const [parsingOriginal, setParsingOriginal] = useState(false);
	const [parsingResult, setParsingResult] = useState(false);
	// Track which resultBlob the current resultFrames were parsed from
	const resultFramesBlobRef = useRef<Blob | null>(null);

	// Parse original GIF frames
	useEffect(() => {
		if (!isGif) return;
		const controller = new AbortController();
		setParsingOriginal(true);
		setOriginalFrames(null);
		setSelectedFrameIndex(0);

		(async () => {
			try {
				const data = await parseGifFrames(file, controller.signal);
				if (controller.signal.aborted) return;
				setOriginalFrames(data);
				setParsingOriginal(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setParsingOriginal(false);
			}
		})();

		return () => {
			controller.abort();
		};
	}, [file, isGif]);

	// Cleanup original frame URLs
	const prevOrigFramesRef = useRef<GifFrameData | null>(null);
	useEffect(() => {
		if (originalFrames) {
			if (prevOrigFramesRef.current) {
				revokeGifFrameUrls(prevOrigFramesRef.current.frames);
			}
			prevOrigFramesRef.current = originalFrames;
		}
		return () => {
			if (prevOrigFramesRef.current) {
				revokeGifFrameUrls(prevOrigFramesRef.current.frames);
				prevOrigFramesRef.current = null;
			}
		};
	}, [originalFrames]);

	// Parse result GIF frames when compression finishes
	useEffect(() => {
		if (!isGif || !resultBlob || converting) return;
		const controller = new AbortController();
		setParsingResult(true);
		// Keep old resultFrames visible (dimmed) while new ones parse

		(async () => {
			try {
				const data = await parseGifFrames(resultBlob, controller.signal);
				if (controller.signal.aborted) return;
				resultFramesBlobRef.current = resultBlob;
				setResultFrames(data);
				setParsingResult(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setParsingResult(false);
			}
		})();

		return () => {
			controller.abort();
		};
	}, [isGif, resultBlob, converting]);

	// Cleanup result frame URLs
	const prevResultFramesRef = useRef<GifFrameData | null>(null);
	useEffect(() => {
		if (resultFrames) {
			if (prevResultFramesRef.current) {
				revokeGifFrameUrls(prevResultFramesRef.current.frames);
			}
			prevResultFramesRef.current = resultFrames;
		}
		return () => {
			if (prevResultFramesRef.current) {
				revokeGifFrameUrls(prevResultFramesRef.current.frames);
				prevResultFramesRef.current = null;
			}
		};
	}, [resultFrames]);

	// Determine compare slider sources — static frame PNGs for GIFs
	const hasGifFrames =
		isGif && originalFrames && originalFrames.frames.length > 1;
	const clampedIndex = hasGifFrames
		? Math.min(selectedFrameIndex, originalFrames.frames.length - 1)
		: 0;
	const compareOriginalSrc = hasGifFrames
		? originalFrames.frames[clampedIndex].previewUrl
		: originalUrl;
	// For GIFs, never use the animated blob URL — only show static frame PNGs
	const compareResultSrc = hasGifFrames
		? (resultFrames?.frames[
				Math.min(clampedIndex, resultFrames.frames.length - 1)
			]?.previewUrl ?? null)
		: resultUrl;

	useEffect(() => {
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	useEffect(() => {
		const controller = new AbortController();
		setConverting(true);
		setError(null);

		(async () => {
			try {
				const result = await config.compress(
					file,
					sliderValue,
					controller.signal,
				);
				if (controller.signal.aborted) return;
				setResultBlob(result.blob);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(result.blob);
				});
				setConverting(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Compression failed");
				setResultBlob(null);
				setResultUrl(null);
				setConverting(false);
			}
		})();

		return () => controller.abort();
	}, [file, sliderValue, config]);

	const outputFilename = toOutputFilename(file.name, config.fileExtension);

	// Show processing state for GIFs while compressing, parsing result frames,
	// or when result frames are stale (parsed from a previous blob)
	const gifStaleFrames =
		isGif &&
		hasGifFrames &&
		resultBlob !== null &&
		resultFramesBlobRef.current !== resultBlob;
	const showProcessing =
		converting || (isGif && hasGifFrames && (parsingResult || gifStaleFrames));

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
							style={{ opacity: showProcessing ? 1 : 0 }}
						>
							{outputFilename} — <Spinner className="size-3 inline" />{" "}
							Compressing...
						</span>
						{resultBlob && (
							<span
								className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
								style={{ opacity: showProcessing ? 0 : 1 }}
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

			{(converting || parsingOriginal) && !hasResult ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					<div className="flex flex-col items-center gap-2 p-4">
						<Spinner className="size-6" />
						<p className="text-sm text-muted-foreground">
							{parsingOriginal ? "Extracting frames..." : "Compressing..."}
						</p>
					</div>
				</div>
			) : error ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					<div className="flex flex-col items-center gap-2 p-4 text-center">
						<AlertCircle className="h-6 w-6 text-destructive" />
						<p className="text-sm text-destructive">{error}</p>
					</div>
				</div>
			) : compareOriginalSrc && compareResultSrc ? (
				<div className="relative">
					<div
						className="transition-opacity duration-300"
						style={{ opacity: showProcessing ? 0.25 : 1 }}
					>
						<ImageCompareSlider
							originalSrc={compareOriginalSrc}
							resultSrc={compareResultSrc}
							height={400}
						/>
					</div>
					{showProcessing && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<Spinner className="size-10" />
						</div>
					)}
				</div>
			) : compareOriginalSrc && hasGifFrames ? (
				/* GIF re-processing: show static original frame with spinner instead of animated GIF */
				<div className="relative rounded-lg border bg-muted/30 overflow-hidden h-[400px]">
					<img
						src={compareOriginalSrc}
						alt="Original"
						className="absolute inset-0 h-full w-full object-contain opacity-25"
					/>
					<div className="absolute inset-0 flex items-center justify-center">
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
			) : null}

			{hasGifFrames && (
				<FrameScrubber
					frames={originalFrames.frames}
					selectedIndex={clampedIndex}
					onFrameChange={setSelectedFrameIndex}
				/>
			)}

			<div className="flex items-center gap-3 h-9">
				{resultBlob && !showProcessing && (
					<DownloadButton blob={resultBlob} filename={outputFilename} />
				)}
				<Button variant="outline" onClick={onReset}>
					Compress more
				</Button>
			</div>
		</div>
	);
}

// ─── Multi-file batch mode ──────────────────────────────────

function BatchView({
	files,
	sliderValue,
	config,
	onReset,
}: {
	files: File[];
	sliderValue: number;
	config: CompressFormatConfig;
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
				const outputs = await config.compressBatch(
					files,
					sliderValue,
					(completedIndex, totalCount) => {
						setProgress({
							completed: completedIndex + 1,
							total: totalCount,
						});
					},
					controller.signal,
				);
				if (controller.signal.aborted) return;
				setResults(
					files.map((file, i) => ({ inputFile: file, output: outputs[i] })),
				);
				setStatus("done");
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Batch compression failed",
				);
				setStatus("done");
			}
		})();

		return () => controller.abort();
	}, [files, sliderValue, config]);

	const successfulResults = results.filter(
		(r): r is BatchResult & { output: CompressResult } =>
			!(r.output instanceof Error),
	);

	const downloadAll = useCallback(() => {
		for (const r of successfulResults) {
			const url = URL.createObjectURL(r.output.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = toOutputFilename(r.inputFile.name, config.fileExtension);
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}, [successfulResults, config.fileExtension]);

	return (
		<div className="space-y-3">
			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{status === "processing" && (
				<ToolProgress
					message={`Compressing ${progress.completed} of ${progress.total} files...`}
				/>
			)}

			{status === "done" && results.length > 0 && (
				<>
					{results.map((r, i) => {
						const outputName = toOutputFilename(
							r.inputFile.name,
							config.fileExtension,
						);

						if (r.output instanceof Error) {
							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: batch results are append-only, never reordered
									key={i}
									className="flex items-center justify-between rounded-lg border bg-card p-3 gap-3"
								>
									<div className="flex items-center gap-2 min-w-0">
										<AlertCircle className="h-4 w-4 text-destructive shrink-0" />
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">
												{outputName}
											</p>
											<p className="text-xs text-destructive">
												Failed: {r.output.message}
											</p>
										</div>
									</div>
								</div>
							);
						}

						const { blob } = r.output;
						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: batch results are append-only, never reordered
								key={i}
								className="flex items-center justify-between rounded-lg border bg-card p-3 gap-3"
							>
								<div className="flex items-center gap-2 min-w-0">
									<CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
									<div className="min-w-0">
										<p className="text-sm font-medium truncate">{outputName}</p>
										<p className="text-xs text-muted-foreground">
											{formatFileSize(r.inputFile.size)} &rarr;{" "}
											{formatFileSize(blob.size)}{" "}
											{blob.size < r.inputFile.size ? (
												<span className="text-primary font-medium">
													(
													{Math.round((1 - blob.size / r.inputFile.size) * 100)}
													% smaller)
												</span>
											) : blob.size > r.inputFile.size ? (
												<span className="text-muted-foreground">
													(
													{Math.round((blob.size / r.inputFile.size - 1) * 100)}
													% larger)
												</span>
											) : (
												<span className="text-muted-foreground">
													(same size)
												</span>
											)}
										</p>
									</div>
								</div>
								<DownloadButton blob={blob} filename={outputName} />
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
							Compress more
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────

export function CompressToolBase({ config }: { config: CompressFormatConfig }) {
	const [sliderValue, setSliderValue] = useState(config.sliderDefault);
	const [files, setFiles] = useState<File[]>([]);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFiles(incoming);
	}, []);

	const reset = useCallback(() => {
		setFiles([]);
	}, []);

	const isSingleFile = files.length === 1;
	const isBatch = files.length > 1;

	return (
		<div className="space-y-6">
			<div className="space-y-2 max-w-sm">
				<span className="text-sm font-medium">
					{config.sliderLabel(sliderValue)}
				</span>
				<Slider
					value={[sliderValue]}
					onValueChange={(v) => setSliderValue(v[0])}
					min={config.sliderMin}
					max={config.sliderMax}
					step={config.sliderStep}
				/>
			</div>

			<div className="min-h-[460px]">
				{files.length === 0 && (
					<div className="h-[460px]">
						<ToolDropzone
							accept={config.accept}
							onFiles={handleFiles}
							multiple
						/>
					</div>
				)}

				{isSingleFile && (
					<SingleFileView
						file={files[0]}
						sliderValue={sliderValue}
						config={config}
						onReset={reset}
					/>
				)}

				{isBatch && (
					<BatchView
						files={files}
						sliderValue={sliderValue}
						config={config}
						onReset={reset}
					/>
				)}
			</div>
		</div>
	);
}
