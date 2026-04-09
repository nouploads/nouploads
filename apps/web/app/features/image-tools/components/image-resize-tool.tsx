import { AlertCircle, Lock, Unlock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import {
	getImageDimensions,
	type ResizeImageResult,
	resizeImage,
} from "../processors/resize-image";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
	{ value: "image/jpeg", label: "JPG" },
	{ value: "image/png", label: "PNG" },
	{ value: "image/webp", label: "WebP" },
];

function extensionForFormat(format: OutputFormat): string {
	switch (format) {
		case "image/jpeg":
			return "jpg";
		case "image/png":
			return "png";
		case "image/webp":
			return "webp";
	}
}

function toOutputFilename(name: string, format: OutputFormat): string {
	const ext = `.${extensionForFormat(format)}`;
	return name.replace(/\.[^.]+$/, ext);
}

export default function ImageResizeTool() {
	const [file, setFile] = useState<File | null>(null);
	const [originalDimensions, setOriginalDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [targetWidth, setTargetWidth] = useState(0);
	const [targetHeight, setTargetHeight] = useState(0);
	const [lockAspect, setLockAspect] = useState(true);
	const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
	const [quality, setQuality] = useState(92);
	const [preset, setPreset] = useState("custom");

	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [resizing, setResizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasResult = resultUrl !== null;

	const aspectRatio = useMemo(() => {
		if (!originalDimensions) return 1;
		return originalDimensions.width / originalDimensions.height;
	}, [originalDimensions]);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFile(incoming[0]);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		setPreset("custom");
	}, []);

	// Get original dimensions when file changes
	useEffect(() => {
		if (!file) return;
		const controller = new AbortController();
		(async () => {
			try {
				const dims = await getImageDimensions(file);
				if (controller.signal.aborted) return;
				setOriginalDimensions(dims);
				setTargetWidth(dims.width);
				setTargetHeight(dims.height);
			} catch {
				// ignore
			}
		})();
		return () => controller.abort();
	}, [file]);

	// Create original preview URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const handleWidthChange = useCallback(
		(w: number) => {
			const clamped = Math.max(1, Math.min(w, 16384));
			setTargetWidth(clamped);
			if (lockAspect && aspectRatio) {
				setTargetHeight(Math.max(1, Math.round(clamped / aspectRatio)));
			}
			setPreset("custom");
		},
		[lockAspect, aspectRatio],
	);

	const handleHeightChange = useCallback(
		(h: number) => {
			const clamped = Math.max(1, Math.min(h, 16384));
			setTargetHeight(clamped);
			if (lockAspect && aspectRatio) {
				setTargetWidth(Math.max(1, Math.round(clamped * aspectRatio)));
			}
			setPreset("custom");
		},
		[lockAspect, aspectRatio],
	);

	const handlePreset = useCallback(
		(value: string) => {
			if (!value || !originalDimensions) return;
			setPreset(value);
			if (value === "custom") return;
			const pct = Number.parseInt(value, 10) / 100;
			const w = Math.max(1, Math.round(originalDimensions.width * pct));
			const h = Math.max(1, Math.round(originalDimensions.height * pct));
			setTargetWidth(w);
			setTargetHeight(h);
		},
		[originalDimensions],
	);

	// Process resize
	useEffect(() => {
		if (!file || !targetWidth || !targetHeight) return;
		if (!originalDimensions) return;

		const controller = new AbortController();
		setResizing(true);
		setError(null);

		const qualityParam =
			outputFormat === "image/png" ? undefined : quality / 100;

		(async () => {
			try {
				const result: ResizeImageResult = await resizeImage(file, {
					width: targetWidth,
					height: targetHeight,
					outputFormat,
					quality: qualityParam,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;

				setResultBlob(result.blob);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(result.blob);
				});
				setResizing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Resize failed");
				setResultBlob(null);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return null;
				});
				setResizing(false);
			}
		})();

		return () => controller.abort();
	}, [
		file,
		targetWidth,
		targetHeight,
		outputFormat,
		quality,
		originalDimensions,
	]);

	const reset = useCallback(() => {
		setFile(null);
		setOriginalDimensions(null);
		setTargetWidth(0);
		setTargetHeight(0);
		setOriginalUrl(null);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		setPreset("custom");
	}, []);

	const showQualitySlider = outputFormat !== "image/png";
	const outputFilename = file ? toOutputFilename(file.name, outputFormat) : "";

	return (
		<div className="space-y-6">
			{!file && (
				<div className="h-[460px]">
					<ToolDropzone
						accept={ACCEPT_IMAGES}
						onFiles={handleFiles}
						multiple={false}
						maxSizeMB={50}
					/>
				</div>
			)}

			{file && originalDimensions && (
				<>
					{/* Controls */}
					<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
						<div className="flex items-end gap-2">
							<div>
								<label
									htmlFor="resize-width"
									className="text-sm font-medium block mb-1"
								>
									Width
								</label>
								<Input
									id="resize-width"
									type="number"
									min={1}
									max={16384}
									value={targetWidth}
									onChange={(e) =>
										handleWidthChange(Number(e.target.value) || 1)
									}
									className="w-24 h-9"
								/>
							</div>

							<button
								type="button"
								onClick={() => {
									setLockAspect((prev) => {
										const next = !prev;
										if (next && aspectRatio) {
											setTargetHeight(
												Math.max(1, Math.round(targetWidth / aspectRatio)),
											);
										}
										return next;
									});
								}}
								className="flex items-center justify-center h-9 w-9 rounded-md border bg-card transition-colors hover:bg-accent"
								title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
							>
								{lockAspect ? (
									<Lock className="h-4 w-4" />
								) : (
									<Unlock className="h-4 w-4" />
								)}
							</button>

							<div>
								<label
									htmlFor="resize-height"
									className="text-sm font-medium block mb-1"
								>
									Height
								</label>
								<Input
									id="resize-height"
									type="number"
									min={1}
									max={16384}
									value={targetHeight}
									onChange={(e) =>
										handleHeightChange(Number(e.target.value) || 1)
									}
									className="w-24 h-9"
								/>
							</div>

							<span className="text-xs text-muted-foreground pb-2">px</span>
						</div>

						<div>
							<span className="text-sm font-medium block mb-1">Preset</span>
							<ToggleGroup
								type="single"
								value={preset}
								onValueChange={handlePreset}
							>
								<ToggleGroupItem value="50" className="text-xs px-3 py-1.5">
									50%
								</ToggleGroupItem>
								<ToggleGroupItem value="25" className="text-xs px-3 py-1.5">
									25%
								</ToggleGroupItem>
								<ToggleGroupItem value="custom" className="text-xs px-3 py-1.5">
									Custom
								</ToggleGroupItem>
							</ToggleGroup>
						</div>

						<div>
							<span className="text-sm font-medium block mb-1">Format</span>
							<Select
								value={outputFormat}
								onValueChange={(v) => setOutputFormat(v as OutputFormat)}
							>
								<SelectTrigger className="w-24" aria-label="Output format">
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
					</div>

					{showQualitySlider && (
						<div className="space-y-2 max-w-sm">
							<span className="text-sm font-medium">Quality: {quality}%</span>
							<Slider
								aria-label="Quality"
								value={[quality]}
								onValueChange={(v) => setQuality(v[0])}
								min={10}
								max={100}
								step={1}
							/>
						</div>
					)}

					{/* Result label */}
					<div className="flex justify-between">
						<div>
							<p className="text-sm font-medium">Original</p>
							<p className="text-xs text-muted-foreground">
								{file.name} — {originalDimensions.width}x
								{originalDimensions.height} — {formatFileSize(file.size)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm font-medium">Result</p>
							<p className="text-xs text-muted-foreground relative">
								<span
									className="inline-flex items-center gap-1.5 transition-opacity duration-300"
									style={{ opacity: resizing ? 1 : 0 }}
								>
									{targetWidth}x{targetHeight} —{" "}
									<Spinner className="size-3 inline" /> Resizing...
								</span>
								{resultBlob && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
										style={{ opacity: resizing ? 0 : 1 }}
									>
										{targetWidth}x{targetHeight} —{" "}
										{formatFileSize(resultBlob.size)}
									</span>
								)}
							</p>
						</div>
					</div>

					{/* Preview */}
					{resizing && !hasResult ? (
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
								style={{ opacity: resizing ? 0.25 : 1 }}
							>
								<ImageCompareSlider
									originalSrc={originalUrl}
									resultSrc={resultUrl}
									height={400}
								/>
							</div>
							<div
								className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
								style={{ opacity: resizing ? 1 : 0 }}
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

					{/* Actions */}
					<div className="flex items-center gap-3 h-9">
						{resultBlob && (
							<DownloadButton
								blob={resultBlob}
								filename={outputFilename}
								disabled={resizing}
							/>
						)}
						<Button variant="outline" onClick={reset}>
							Resize another
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
