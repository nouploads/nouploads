import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import { type CropRegion, cropImage } from "../processors/crop-image";
import { getImageDimensions } from "../processors/resize-image";

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

const ASPECT_PRESETS: { value: string; label: string; ratio: number | null }[] =
	[
		{ value: "free", label: "Free", ratio: null },
		{ value: "1:1", label: "1:1", ratio: 1 },
		{ value: "4:3", label: "4:3", ratio: 4 / 3 },
		{ value: "16:9", label: "16:9", ratio: 16 / 9 },
		{ value: "3:2", label: "3:2", ratio: 3 / 2 },
	];

// ─── Crop Overlay ────────────────────────────────────────────

type DragMode =
	| "move"
	| "nw"
	| "ne"
	| "sw"
	| "se"
	| "n"
	| "s"
	| "e"
	| "w"
	| null;

function CropOverlay({
	containerWidth,
	containerHeight,
	crop,
	onCropChange,
	aspectRatio,
}: {
	containerWidth: number;
	containerHeight: number;
	crop: CropRegion;
	onCropChange: (crop: CropRegion) => void;
	aspectRatio: number | null;
}) {
	const overlayRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		mode: DragMode;
		startX: number;
		startY: number;
		startCrop: CropRegion;
	} | null>(null);

	const clamp = useCallback(
		(region: CropRegion): CropRegion => {
			const minSize = 10;
			let { x, y, width, height } = region;
			width = Math.max(minSize, Math.min(width, containerWidth));
			height = Math.max(minSize, Math.min(height, containerHeight));
			x = Math.max(0, Math.min(x, containerWidth - width));
			y = Math.max(0, Math.min(y, containerHeight - height));
			return { x, y, width, height };
		},
		[containerWidth, containerHeight],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent, mode: DragMode) => {
			e.preventDefault();
			e.stopPropagation();
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
			dragRef.current = {
				mode,
				startX: e.clientX,
				startY: e.clientY,
				startCrop: { ...crop },
			};
		},
		[crop],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragRef.current) return;
			const { mode, startX, startY, startCrop } = dragRef.current;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;

			let next: CropRegion;

			if (mode === "move") {
				next = clamp({
					x: startCrop.x + dx,
					y: startCrop.y + dy,
					width: startCrop.width,
					height: startCrop.height,
				});
			} else {
				let newX = startCrop.x;
				let newY = startCrop.y;
				let newW = startCrop.width;
				let newH = startCrop.height;

				// Horizontal resize
				if (mode === "e" || mode === "ne" || mode === "se") {
					newW = Math.max(10, startCrop.width + dx);
				}
				if (mode === "w" || mode === "nw" || mode === "sw") {
					const moved = Math.min(dx, startCrop.width - 10);
					newX = startCrop.x + moved;
					newW = startCrop.width - moved;
				}

				// Vertical resize
				if (mode === "s" || mode === "se" || mode === "sw") {
					newH = Math.max(10, startCrop.height + dy);
				}
				if (mode === "n" || mode === "ne" || mode === "nw") {
					const moved = Math.min(dy, startCrop.height - 10);
					newY = startCrop.y + moved;
					newH = startCrop.height - moved;
				}

				// Enforce aspect ratio if set
				if (aspectRatio !== null) {
					if (
						mode === "n" ||
						mode === "s" ||
						mode === "ne" ||
						mode === "nw" ||
						mode === "se" ||
						mode === "sw"
					) {
						newW = Math.round(newH * aspectRatio);
					} else {
						newH = Math.round(newW / aspectRatio);
					}
				}

				next = clamp({ x: newX, y: newY, width: newW, height: newH });
			}

			onCropChange(next);
		},
		[clamp, onCropChange, aspectRatio],
	);

	const handlePointerUp = useCallback(() => {
		dragRef.current = null;
	}, []);

	const handleStyle: React.CSSProperties = {
		width: 10,
		height: 10,
		backgroundColor: "white",
		border: "1px solid rgba(0,0,0,0.5)",
		position: "absolute",
		borderRadius: 2,
		zIndex: 10,
	};

	return (
		<div
			ref={overlayRef}
			className="absolute inset-0"
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{/* Dark overlay — top */}
			<div
				className="absolute bg-black/50"
				style={{
					top: 0,
					left: 0,
					right: 0,
					height: crop.y,
				}}
			/>
			{/* Dark overlay — bottom */}
			<div
				className="absolute bg-black/50"
				style={{
					top: crop.y + crop.height,
					left: 0,
					right: 0,
					bottom: 0,
				}}
			/>
			{/* Dark overlay — left */}
			<div
				className="absolute bg-black/50"
				style={{
					top: crop.y,
					left: 0,
					width: crop.x,
					height: crop.height,
				}}
			/>
			{/* Dark overlay — right */}
			<div
				className="absolute bg-black/50"
				style={{
					top: crop.y,
					left: crop.x + crop.width,
					right: 0,
					height: crop.height,
				}}
			/>

			{/* Crop area — movable */}
			<div
				className="absolute border-2 border-white cursor-move"
				style={{
					left: crop.x,
					top: crop.y,
					width: crop.width,
					height: crop.height,
				}}
				onPointerDown={(e) => handlePointerDown(e, "move")}
			>
				{/* Rule of thirds grid lines */}
				<div
					className="absolute border-white/30 border-l"
					style={{ left: "33.33%", top: 0, bottom: 0 }}
				/>
				<div
					className="absolute border-white/30 border-l"
					style={{ left: "66.66%", top: 0, bottom: 0 }}
				/>
				<div
					className="absolute border-white/30 border-t"
					style={{ top: "33.33%", left: 0, right: 0 }}
				/>
				<div
					className="absolute border-white/30 border-t"
					style={{ top: "66.66%", left: 0, right: 0 }}
				/>
			</div>

			{/* Corner handles */}
			<div
				style={{
					...handleStyle,
					left: crop.x - 5,
					top: crop.y - 5,
					cursor: "nw-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "nw")}
			/>
			<div
				style={{
					...handleStyle,
					left: crop.x + crop.width - 5,
					top: crop.y - 5,
					cursor: "ne-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "ne")}
			/>
			<div
				style={{
					...handleStyle,
					left: crop.x - 5,
					top: crop.y + crop.height - 5,
					cursor: "sw-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "sw")}
			/>
			<div
				style={{
					...handleStyle,
					left: crop.x + crop.width - 5,
					top: crop.y + crop.height - 5,
					cursor: "se-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "se")}
			/>

			{/* Edge handles */}
			<div
				style={{
					...handleStyle,
					left: crop.x + crop.width / 2 - 5,
					top: crop.y - 5,
					cursor: "n-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "n")}
			/>
			<div
				style={{
					...handleStyle,
					left: crop.x + crop.width / 2 - 5,
					top: crop.y + crop.height - 5,
					cursor: "s-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "s")}
			/>
			<div
				style={{
					...handleStyle,
					left: crop.x - 5,
					top: crop.y + crop.height / 2 - 5,
					cursor: "w-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "w")}
			/>
			<div
				style={{
					...handleStyle,
					left: crop.x + crop.width - 5,
					top: crop.y + crop.height / 2 - 5,
					cursor: "e-resize",
				}}
				onPointerDown={(e) => handlePointerDown(e, "e")}
			/>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────

export default function ImageCropTool() {
	const [file, setFile] = useState<File | null>(null);
	const [originalDimensions, setOriginalDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
	const [aspectPreset, setAspectPreset] = useState("free");
	const [quality, setQuality] = useState(92);

	// Crop region in display coordinates
	const [crop, setCrop] = useState<CropRegion>({
		x: 0,
		y: 0,
		width: 100,
		height: 100,
	});

	// Display container dimensions
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [cropping, setCropping] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedAspect = useMemo(
		() => ASPECT_PRESETS.find((p) => p.value === aspectPreset)?.ratio ?? null,
		[aspectPreset],
	);

	// Scale factor from display coordinates to image coordinates
	const scale = useMemo(() => {
		if (!originalDimensions || !containerSize) return 1;
		return originalDimensions.width / containerSize.width;
	}, [originalDimensions, containerSize]);

	// Real crop region in image coordinates
	const realCrop = useMemo(
		(): CropRegion => ({
			x: Math.round(crop.x * scale),
			y: Math.round(crop.y * scale),
			width: Math.round(crop.width * scale),
			height: Math.round(crop.height * scale),
		}),
		[crop, scale],
	);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFile(incoming[0]);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
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

	// Measure container and set initial crop when image loads
	const handleImageLoad = useCallback(() => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const w = rect.width;
		const h = rect.height;
		setContainerSize({ width: w, height: h });

		// Default crop to 80% centered
		const cropW = Math.round(w * 0.8);
		const cropH = Math.round(h * 0.8);
		setCrop({
			x: Math.round((w - cropW) / 2),
			y: Math.round((h - cropH) / 2),
			width: cropW,
			height: cropH,
		});
	}, []);

	const handleAspectChange = useCallback(
		(value: string) => {
			if (!value) return;
			setAspectPreset(value);
			const preset = ASPECT_PRESETS.find((p) => p.value === value);
			if (!preset?.ratio || !containerSize) return;

			// Recalculate crop to match new aspect ratio, centered
			const ratio = preset.ratio;
			let cropW = crop.width;
			let cropH = Math.round(cropW / ratio);
			if (cropH > containerSize.height) {
				cropH = containerSize.height * 0.8;
				cropW = Math.round(cropH * ratio);
			}
			if (cropW > containerSize.width) {
				cropW = containerSize.width * 0.8;
				cropH = Math.round(cropW / ratio);
			}
			setCrop({
				x: Math.round((containerSize.width - cropW) / 2),
				y: Math.round((containerSize.height - cropH) / 2),
				width: Math.round(cropW),
				height: Math.round(cropH),
			});
		},
		[containerSize, crop.width],
	);

	const handleApplyCrop = useCallback(() => {
		if (!file) return;
		const controller = new AbortController();
		setCropping(true);
		setError(null);

		const qualityParam =
			outputFormat === "image/png" ? undefined : quality / 100;

		(async () => {
			try {
				const result = await cropImage(file, {
					crop: realCrop,
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
				setCropping(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Crop failed");
				setResultBlob(null);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return null;
				});
				setCropping(false);
			}
		})();

		return () => controller.abort();
	}, [file, realCrop, outputFormat, quality]);

	const resetCrop = useCallback(() => {
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		// Restore default crop
		if (containerSize) {
			const cropW = Math.round(containerSize.width * 0.8);
			const cropH = Math.round(containerSize.height * 0.8);
			setCrop({
				x: Math.round((containerSize.width - cropW) / 2),
				y: Math.round((containerSize.height - cropH) / 2),
				width: cropW,
				height: cropH,
			});
		}
	}, [containerSize]);

	const resetAll = useCallback(() => {
		setFile(null);
		setOriginalDimensions(null);
		setOriginalUrl(null);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		setContainerSize(null);
		setAspectPreset("free");
	}, []);

	const showQualitySlider = outputFormat !== "image/png";
	const outputFilename = file ? toOutputFilename(file.name, outputFormat) : "";
	const showCropEditor = file && originalUrl && !resultUrl && !cropping;
	const showResult = resultUrl && resultBlob && !cropping;

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

			{file && (
				<>
					{/* Controls */}
					<div className="flex flex-wrap items-end gap-x-6 gap-y-3">
						<div>
							<span className="text-sm font-medium block mb-1">
								Aspect ratio
							</span>
							<ToggleGroup
								type="single"
								value={aspectPreset}
								onValueChange={handleAspectChange}
							>
								{ASPECT_PRESETS.map((p) => (
									<ToggleGroupItem
										key={p.value}
										value={p.value}
										className="text-xs px-3 py-1.5"
									>
										{p.label}
									</ToggleGroupItem>
								))}
							</ToggleGroup>
						</div>

						<div>
							<span className="text-sm font-medium block mb-1">Format</span>
							<Select
								value={outputFormat}
								onValueChange={(v) => setOutputFormat(v as OutputFormat)}
							>
								<SelectTrigger className="w-24">
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

						{showQualitySlider && (
							<div className="space-y-2 w-48">
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
					</div>

					{/* Crop dimensions info */}
					{containerSize && !resultUrl && (
						<p className="text-xs text-muted-foreground">
							Crop area: {realCrop.width}x{realCrop.height} px
						</p>
					)}

					{/* Crop editor */}
					{showCropEditor && (
						<div
							ref={containerRef}
							className="relative rounded-lg border bg-muted/30 overflow-hidden"
							style={{ maxHeight: 500 }}
						>
							<img
								src={originalUrl}
								alt="Original"
								className="block w-full h-auto"
								style={{ maxHeight: 500, objectFit: "contain" }}
								onLoad={handleImageLoad}
								draggable={false}
							/>
							{containerSize && (
								<CropOverlay
									containerWidth={containerSize.width}
									containerHeight={containerSize.height}
									crop={crop}
									onCropChange={setCrop}
									aspectRatio={selectedAspect}
								/>
							)}
						</div>
					)}

					{/* Processing state */}
					{cropping && (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
							<div className="flex flex-col items-center gap-2 p-4">
								<Spinner className="size-6" />
								<p className="text-sm text-muted-foreground">Cropping...</p>
							</div>
						</div>
					)}

					{/* Error */}
					{error && (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
							<div className="flex flex-col items-center gap-2 p-4 text-center">
								<AlertCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						</div>
					)}

					{/* Result */}
					{showResult && (
						<div className="space-y-4">
							<div className="flex justify-between">
								<div>
									<p className="text-sm font-medium">Original</p>
									<p className="text-xs text-muted-foreground">
										{file.name} —{" "}
										{originalDimensions
											? `${originalDimensions.width}x${originalDimensions.height}`
											: ""}{" "}
										— {formatFileSize(file.size)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-medium">Cropped</p>
									<p className="text-xs text-muted-foreground">
										{realCrop.width}x{realCrop.height} —{" "}
										{formatFileSize(resultBlob.size)}
									</p>
								</div>
							</div>

							<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
								<img
									src={resultUrl}
									alt="Cropped result"
									className="max-w-full max-h-full object-contain"
								/>
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center gap-3 h-9">
						{showCropEditor && containerSize && (
							<Button onClick={handleApplyCrop}>Apply Crop</Button>
						)}
						{showResult && (
							<>
								<DownloadButton blob={resultBlob} filename={outputFilename} />
								<Button variant="outline" onClick={resetCrop}>
									Crop more
								</Button>
							</>
						)}
						<Button variant="outline" onClick={resetAll}>
							{resultUrl ? "Start over" : "Choose another"}
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
