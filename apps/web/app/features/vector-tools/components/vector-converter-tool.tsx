import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { formatFileSize } from "~/lib/utils";
import {
	extensionForVectorFormat,
	rasteriseSvg,
	type VectorOutputFormat,
} from "../processors/convert-vector";

const OUTPUT_FORMATS: { value: VectorOutputFormat; label: string }[] = [
	{ value: "svg", label: "SVG" },
	{ value: "image/png", label: "PNG" },
	{ value: "image/jpeg", label: "JPG" },
	{ value: "image/webp", label: "WebP" },
	{ value: "image/avif", label: "AVIF" },
];

const SCALE_OPTIONS = [
	{ value: 1, label: "1x" },
	{ value: 2, label: "2x" },
	{ value: 4, label: "4x" },
];

function toOutputFilename(name: string, format: VectorOutputFormat): string {
	const ext = `.${extensionForVectorFormat(format)}`;
	return name.replace(/\.[^.]+$/, ext);
}

function sizeChangeLabel(original: number, result: number): string {
	if (original === 0) return "";
	const pct = Math.round(((result - original) / original) * 100);
	if (pct === 0) return "(same size)";
	return pct > 0 ? `(${pct}% larger)` : `(${Math.abs(pct)}% smaller)`;
}

/** Read an SVG file and return its text content. */
async function readSvgText(file: File, signal?: AbortSignal): Promise<string> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	return await file.text();
}

// ─── Single-file preview & conversion ──────────────────────────

function SingleFileView({
	file,
	outputFormat,
	quality,
	scale,
	onReset,
}: {
	file: File;
	outputFormat: VectorOutputFormat;
	quality: number;
	scale: number;
	onReset: () => void;
}) {
	const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [converting, setConverting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasResult = resultBlob !== null;

	// Read SVG text and create preview URL on file change
	useEffect(() => {
		const controller = new AbortController();
		let blobUrl: string | null = null;

		(async () => {
			try {
				const text = await readSvgText(file, controller.signal);
				if (controller.signal.aborted) return;
				setSvgMarkup(text);

				const blob = new Blob([text], { type: "image/svg+xml" });
				blobUrl = URL.createObjectURL(blob);
				setPreviewUrl(blobUrl);
			} catch {
				if (controller.signal.aborted) return;
				setError("Failed to read SVG file");
			}
		})();

		return () => {
			controller.abort();
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [file]);

	// Convert when format, quality, or scale changes
	useEffect(() => {
		if (!svgMarkup) return;

		const controller = new AbortController();
		setConverting(true);
		setError(null);

		(async () => {
			try {
				let blob: Blob;

				if (outputFormat === "svg") {
					// SVG output: return the markup directly
					blob = new Blob([svgMarkup], { type: "image/svg+xml" });
				} else {
					// Raster output: render SVG to canvas
					blob = await rasteriseSvg(svgMarkup, {
						mime: outputFormat,
						scale,
						quality: outputFormat === "image/png" ? undefined : quality / 100,
						signal: controller.signal,
					});
				}

				if (controller.signal.aborted) return;
				setResultBlob(blob);
				setConverting(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Conversion failed");
				setResultBlob(null);
				setConverting(false);
			}
		})();

		return () => controller.abort();
	}, [svgMarkup, outputFormat, quality, scale]);

	const outputFilename = toOutputFilename(file.name, outputFormat);

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

			{/* Preview area */}
			{converting && !hasResult ? (
				<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
					{previewUrl ? (
						<div className="relative h-full w-full">
							<img
								src={previewUrl}
								alt="Original SVG"
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
			) : previewUrl ? (
				<div className="relative">
					<div
						className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px] transition-opacity duration-300"
						style={{ opacity: converting ? 0.25 : 1 }}
					>
						<img
							src={previewUrl}
							alt="SVG preview"
							className="max-w-full max-h-full object-contain"
						/>
					</div>
					<div
						className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
						style={{ opacity: converting ? 1 : 0 }}
					>
						<Spinner className="size-10" />
					</div>
				</div>
			) : null}

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

// ─── Main component ────────────────────────────────────────────

export interface VectorConverterProps {
	/** Restrict accepted input formats. Defaults to SVG only. */
	accept?: Record<string, string[]>;
}

const DEFAULT_ACCEPT: Record<string, string[]> = {
	"image/svg+xml": [".svg"],
};

export default function VectorConverterTool({
	accept = DEFAULT_ACCEPT,
}: VectorConverterProps) {
	const [outputFormat, setOutputFormat] = useState<VectorOutputFormat>("svg");
	const [file, setFile] = useState<File | null>(null);
	const [quality, setQuality] = useState(92);
	const [scale, setScale] = useState(1);

	const isRaster = outputFormat !== "svg";
	const isLossy =
		outputFormat === "image/jpeg" ||
		outputFormat === "image/webp" ||
		outputFormat === "image/avif";

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFile(incoming[0]);
	}, []);

	const handleOutputFormatChange = useCallback((v: string) => {
		setOutputFormat(v as VectorOutputFormat);
	}, []);

	const reset = useCallback(() => {
		setFile(null);
	}, []);

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
							{OUTPUT_FORMATS.map((f) => (
								<SelectItem key={f.value} value={f.value}>
									{f.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{isRaster && (
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium">Scale:</span>
						<Select
							value={String(scale)}
							onValueChange={(v) => setScale(Number(v))}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SCALE_OPTIONS.map((s) => (
									<SelectItem key={s.value} value={String(s.value)}>
										{s.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			{isLossy && (
				<div className="space-y-2 max-w-sm">
					<span className="text-sm font-medium">Quality: {quality}%</span>
					<Slider
						value={[quality]}
						onValueChange={(v) => setQuality(v[0])}
						min={10}
						max={100}
						step={1}
					/>
				</div>
			)}

			<div className="min-h-[460px]">
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={accept} onFiles={handleFiles} />
					</div>
				)}

				{file && (
					<SingleFileView
						file={file}
						outputFormat={outputFormat}
						quality={quality}
						scale={scale}
						onReset={reset}
					/>
				)}
			</div>
		</div>
	);
}
