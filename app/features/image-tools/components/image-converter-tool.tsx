import { AlertCircle, CheckCircle2, Download, Pipette } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
	type ColorFormat,
	formatColor,
	parseToHex,
} from "~/features/developer-tools/processors/color-picker";
import { formatFileSize } from "~/lib/utils";
import { compressPng, compressPngBatch } from "../processors/compress-png";
import {
	type ConvertImageResult,
	type ConvertOutputFormat,
	convertImage,
	convertImageBatch,
	detectTransparency,
	ensureDecodable,
	extensionForFormat,
	formatRequiresBackground,
} from "../processors/convert-image";
import { GifFrameSelector } from "./gif-frame-selector";
import { FORMAT_QUALITY, QualitySlider } from "./quality-slider";

const OUTPUT_FORMATS: { value: ConvertOutputFormat; label: string }[] = [
	{ value: "image/jpeg", label: "JPG" },
	{ value: "image/png", label: "PNG" },
	{ value: "image/webp", label: "WebP" },
	{ value: "image/avif", label: "AVIF" },
];

/** Map common input MIME types to output format values for exclusion. */
function inputMimeToOutputFormat(mime: string): ConvertOutputFormat | null {
	switch (mime) {
		case "image/jpeg":
			return "image/jpeg";
		case "image/png":
			return "image/png";
		case "image/webp":
			return "image/webp";
		case "image/avif":
			return "image/avif";
		default:
			return null;
	}
}

/** Pick a sensible default output format that differs from the input. */
function pickDefaultOutput(
	inputFormat: ConvertOutputFormat | null,
	preferred: ConvertOutputFormat,
): ConvertOutputFormat {
	if (!inputFormat || inputFormat !== preferred) return preferred;
	// Input matches preferred — pick a fallback
	return inputFormat === "image/webp" ? "image/png" : "image/webp";
}

function toOutputFilename(name: string, format: ConvertOutputFormat): string {
	const ext = `.${extensionForFormat(format)}`;
	return name.replace(/\.[^.]+$/, ext);
}

function sizeChangeLabel(original: number, result: number): string {
	if (original === 0) return "";
	const pct = Math.round(((result - original) / original) * 100);
	if (pct === 0) return "(same size)";
	return pct > 0 ? `(${pct}% larger)` : `(${Math.abs(pct)}% smaller)`;
}

// ─── Single-file mode ───────────────────────────────────────

function SingleFileView({
	file,
	outputFormat,
	backgroundColor,
	quality,
	onReset,
}: {
	file: File;
	outputFormat: ConvertOutputFormat;
	backgroundColor: string;
	quality: number;
	onReset: () => void;
}) {
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [converting, setConverting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [frameBlob, setFrameBlob] = useState<Blob | null>(null);
	const hasResult = resultUrl !== null;

	const showFrameSelector = file.type === "image/gif";

	// When frame selector provides a frame blob, use it for the "original" preview
	const previewSource = frameBlob ?? file;

	useEffect(() => {
		const controller = new AbortController();
		let revoke: string | null = null;
		(async () => {
			try {
				const decoded = await ensureDecodable(previewSource, controller.signal);
				if (controller.signal.aborted) return;
				const url = URL.createObjectURL(decoded);
				revoke = url;
				setOriginalUrl(url);
			} catch {
				// Aborted or decode failed
			}
		})();
		return () => {
			controller.abort();
			if (revoke) URL.revokeObjectURL(revoke);
		};
	}, [previewSource]);

	useEffect(() => {
		// When frame selector is active, wait until a frame blob is available
		if (showFrameSelector && !frameBlob) return;

		const controller = new AbortController();
		setConverting(true);
		setError(null);
		// Keep previous resultUrl/resultBlob visible until the new one is ready

		const convertInput = frameBlob ?? file;

		(async () => {
			try {
				// For PNG: quality slider controls color quantization (2–256)
				// For JPG/WebP/AVIF: quality slider controls lossy quality (10–100 → 0.1–1.0)
				const isPng = outputFormat === "image/png";
				const canvasQuality = isPng ? undefined : quality / 100;

				const result = await convertImage(convertInput, {
					outputFormat,
					backgroundColor,
					quality: canvasQuality,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;

				// For PNG with color reduction, run quantization as a second pass
				let finalBlob = result.blob;
				if (isPng && quality < 256) {
					const quantized = await compressPng(result.blob, {
						colors: quality,
						signal: controller.signal,
					});
					if (controller.signal.aborted) return;
					finalBlob = quantized.blob;
				}

				setResultBlob(finalBlob);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(finalBlob);
				});
				setConverting(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Conversion failed");
				setResultBlob(null);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return null;
				});
				setConverting(false);
			}
		})();

		return () => controller.abort();
	}, [
		file,
		outputFormat,
		backgroundColor,
		quality,
		frameBlob,
		showFrameSelector,
	]);

	const outputFilename = toOutputFilename(file.name, outputFormat);
	const formatLabel =
		OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.label ?? "image";

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
								<span
									className={
										resultBlob.size <= file.size
											? "text-green-600 dark:text-green-400"
											: "text-orange-600 dark:text-orange-400"
									}
								>
									{sizeChangeLabel(file.size, resultBlob.size)}
								</span>
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
			) : null}

			{showFrameSelector && (
				<GifFrameSelector file={file} onFrameSelect={setFrameBlob} />
			)}

			<div className="flex items-center gap-3 h-9">
				{resultBlob && !converting && (
					<DownloadButton blob={resultBlob} filename={outputFilename} />
				)}
				<Button variant="outline" onClick={onReset}>
					Convert another
				</Button>
			</div>
		</div>
	);
}

// ─── Multi-file batch mode ──────────────────────────────────

interface BatchResult {
	inputFile: File;
	output: ConvertImageResult | Error;
}

function BatchView({
	files,
	outputFormat,
	backgroundColor,
	quality,
	onReset,
}: {
	files: File[];
	outputFormat: ConvertOutputFormat;
	backgroundColor: string;
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

		const isPng = outputFormat === "image/png";
		const canvasQuality = isPng ? undefined : quality / 100;

		(async () => {
			try {
				const outputs = await convertImageBatch(
					files,
					{
						outputFormat,
						backgroundColor,
						quality: canvasQuality,
						signal: controller.signal,
					},
					(completedIndex, totalCount) => {
						setProgress({
							completed: completedIndex + 1,
							total: totalCount,
						});
					},
				);
				if (controller.signal.aborted) return;

				// For PNG with color reduction, quantize each successful result
				let finalOutputs = outputs;
				if (isPng && quality < 256) {
					finalOutputs = await Promise.all(
						outputs.map(async (out) => {
							if (out instanceof Error) return out;
							if (controller.signal.aborted) return out;
							try {
								return await compressPng(out.blob, {
									colors: quality,
									signal: controller.signal,
								});
							} catch (err) {
								if (controller.signal.aborted) return out;
								return err instanceof Error ? err : new Error(String(err));
							}
						}),
					);
				}
				if (controller.signal.aborted) return;

				setResults(
					files.map((file, i) => ({
						inputFile: file,
						output: finalOutputs[i],
					})),
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
	}, [files, outputFormat, backgroundColor, quality]);

	const successfulResults = results.filter(
		(r): r is BatchResult & { output: ConvertImageResult } =>
			!(r.output instanceof Error),
	);

	const downloadAll = useCallback(() => {
		for (const r of successfulResults) {
			const url = URL.createObjectURL(r.output.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = toOutputFilename(r.inputFile.name, outputFormat);
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	}, [successfulResults, outputFormat]);

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
						const outputName = toOutputFilename(r.inputFile.name, outputFormat);

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
											<span
												className={
													blob.size <= r.inputFile.size
														? "text-green-600 dark:text-green-400"
														: "text-orange-600 dark:text-orange-400"
												}
											>
												{sizeChangeLabel(r.inputFile.size, blob.size)}
											</span>
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
							Convert more
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────

export interface ImageConverterProps {
	/** Pre-select output format for format-specific landing pages */
	defaultOutputFormat?: ConvertOutputFormat;
	/** Restrict accepted input formats for format-specific landing pages */
	accept?: Record<string, string[]>;
}

// ─── Background color picker ─────────────────────────────────

const BG_FORMAT_KEY = "bgColorFormat";
const BG_FORMATS: { value: ColorFormat; label: string }[] = [
	{ value: "hex", label: "HEX" },
	{ value: "rgb", label: "RGB" },
	{ value: "hsl", label: "HSL" },
	{ value: "oklch", label: "OKLCH" },
];

function readBgFormat(): ColorFormat {
	if (typeof window === "undefined") return "hex";
	const stored = localStorage.getItem(BG_FORMAT_KEY);
	if (stored && BG_FORMATS.some((f) => f.value === stored)) {
		return stored as ColorFormat;
	}
	return "hex";
}

function BackgroundColorPicker({
	color,
	onChange,
}: {
	color: string;
	onChange: (color: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [fmt, setFmt] = useState<ColorFormat>("hex");
	const [inputValue, setInputValue] = useState(color);
	const [inputDirty, setInputDirty] = useState(false);
	const [eyeDropperSupported, setEyeDropperSupported] = useState(false);

	useEffect(() => {
		setEyeDropperSupported("EyeDropper" in window);
	}, []);

	const handleEyeDropper = useCallback(async () => {
		try {
			// @ts-expect-error EyeDropper API not yet in all TS libs
			const dropper = new EyeDropper();
			const result = await dropper.open();
			const picked = parseToHex(result.sRGBHex);
			if (picked) onChange(picked);
		} catch {
			// User cancelled
		}
	}, [onChange]);

	// Load format preference on mount only
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally mount-only — subsequent color changes are handled by the sync effect below
	useEffect(() => {
		const stored = readBgFormat();
		setFmt(stored);
		setInputValue(formatColor(color, stored));
	}, []);

	// Sync input text when color or format changes (unless user is typing)
	useEffect(() => {
		if (!inputDirty) {
			setInputValue(formatColor(color, fmt));
		}
	}, [color, fmt, inputDirty]);

	const handleFormatChange = useCallback(
		(value: string) => {
			if (!value) return;
			const f = value as ColorFormat;
			setFmt(f);
			localStorage.setItem(BG_FORMAT_KEY, f);
			setInputDirty(false);
			setInputValue(formatColor(color, f));
		},
		[color],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const v = e.target.value;
			setInputValue(v);
			setInputDirty(true);
			const parsed = parseToHex(v);
			if (parsed) onChange(parsed);
		},
		[onChange],
	);

	const handleInputBlur = useCallback(() => {
		setInputDirty(false);
		setInputValue(formatColor(color, fmt));
	}, [color, fmt]);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-3">
				<span className="text-sm font-medium">Background:</span>
				<div className="relative">
					<button
						type="button"
						onClick={() => setOpen((o) => !o)}
						className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/40"
					>
						<span
							className="inline-block h-4 w-4 rounded border"
							style={{ backgroundColor: color }}
						/>
						<span className="font-mono uppercase">{color}</span>
					</button>
					{open && (
						<div className="absolute top-full left-0 z-50 mt-2 rounded-lg border bg-card p-3 shadow-lg">
							<HexColorPicker color={color} onChange={onChange} />
							<div className="mt-2">
								<ToggleGroup
									type="single"
									value={fmt}
									onValueChange={handleFormatChange}
									className="justify-start"
								>
									{BG_FORMATS.map((f) => (
										<ToggleGroupItem
											key={f.value}
											value={f.value}
											size="sm"
											className="text-xs px-2 py-1"
										>
											{f.label}
										</ToggleGroupItem>
									))}
								</ToggleGroup>
							</div>
							<div className="mt-2">
								<Input
									value={inputValue}
									onChange={handleInputChange}
									onBlur={handleInputBlur}
									className="text-sm font-mono h-8"
									aria-label="Background color value"
								/>
							</div>
							<div className="mt-2 flex items-center gap-1">
								{["#ffffff", "#000000", "#f8f8f8", "#e2e2e2"].map((preset) => (
									<button
										key={preset}
										type="button"
										onClick={() => onChange(preset)}
										className="h-6 w-6 rounded border transition-transform hover:scale-110"
										style={{ backgroundColor: preset }}
										title={preset}
									/>
								))}
								{eyeDropperSupported && (
									<button
										type="button"
										onClick={handleEyeDropper}
										className="ml-auto h-6 w-6 rounded border flex items-center justify-center transition-colors hover:bg-muted"
										title="Pick from screen"
									>
										<Pipette className="h-3.5 w-3.5 text-muted-foreground" />
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────

export default function ImageConverterTool({
	defaultOutputFormat = "image/webp",
	accept,
}: ImageConverterProps) {
	const [outputFormat, setOutputFormat] =
		useState<ConvertOutputFormat>(defaultOutputFormat);
	const [files, setFiles] = useState<File[]>([]);
	const [backgroundColor, setBackgroundColor] = useState("#ffffff");
	const [hasTransparency, setHasTransparency] = useState(false);
	const [inputFormat, setInputFormat] = useState<ConvertOutputFormat | null>(
		null,
	);
	const [quality, setQuality] = useState(
		FORMAT_QUALITY[defaultOutputFormat].defaultValue,
	);

	// Reset quality to format default when output format changes
	const handleOutputFormatChange = useCallback((v: string) => {
		const fmt = v as ConvertOutputFormat;
		setOutputFormat(fmt);
		setQuality(FORMAT_QUALITY[fmt].defaultValue);
	}, []);

	const handleFiles = useCallback(
		(incoming: File[]) => {
			if (incoming.length === 0) return;
			setFiles(incoming);

			// Detect input format from the first file
			const detectedInput = inputMimeToOutputFormat(incoming[0].type);
			setInputFormat(detectedInput);

			// Auto-switch output if it matches the input
			if (detectedInput && detectedInput === outputFormat) {
				const newFormat = pickDefaultOutput(detectedInput, defaultOutputFormat);
				setOutputFormat(newFormat);
				setQuality(FORMAT_QUALITY[newFormat].defaultValue);
			}
		},
		[outputFormat, defaultOutputFormat],
	);

	// Detect transparency when files change
	useEffect(() => {
		if (files.length === 0) {
			setHasTransparency(false);
			return;
		}

		let cancelled = false;
		(async () => {
			// Check first file for transparency (representative sample)
			try {
				const transparent = await detectTransparency(files[0]);
				if (!cancelled) setHasTransparency(transparent);
			} catch {
				if (!cancelled) setHasTransparency(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [files]);

	const reset = useCallback(() => {
		setFiles([]);
		setHasTransparency(false);
		setInputFormat(null);
	}, []);

	// Filter out the input format from the output options
	const availableFormats = inputFormat
		? OUTPUT_FORMATS.filter((f) => f.value !== inputFormat)
		: OUTPUT_FORMATS;

	const showColorPicker =
		hasTransparency && formatRequiresBackground(outputFormat);
	const isSingleFile = files.length === 1;
	const isBatch = files.length > 1;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium">Output format:</span>
					<Select value={outputFormat} onValueChange={handleOutputFormatChange}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{availableFormats.map((f) => (
								<SelectItem key={f.value} value={f.value}>
									{f.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{showColorPicker && (
					<BackgroundColorPicker
						color={backgroundColor}
						onChange={setBackgroundColor}
					/>
				)}
			</div>

			<QualitySlider
				format={outputFormat}
				value={quality}
				onChange={setQuality}
			/>

			<div className="min-h-[460px]">
				{files.length === 0 && (
					<div className="h-[460px]">
						<ToolDropzone accept={accept} onFiles={handleFiles} multiple />
					</div>
				)}

				{isSingleFile && (
					<SingleFileView
						file={files[0]}
						outputFormat={outputFormat}
						backgroundColor={backgroundColor}
						quality={quality}
						onReset={reset}
					/>
				)}

				{isBatch && (
					<BatchView
						files={files}
						outputFormat={outputFormat}
						backgroundColor={backgroundColor}
						quality={quality}
						onReset={reset}
					/>
				)}
			</div>
		</div>
	);
}
