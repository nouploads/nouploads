import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { ACCEPT_IMAGES_RASTER } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import {
	type WatermarkImageResult,
	watermarkImage,
} from "../processors/watermark-image";

type WatermarkMode = "center" | "tiled";

export default function ImageWatermarkTool() {
	const [file, setFile] = useState<File | null>(null);
	const [text, setText] = useState("SAMPLE");
	const [fontSize, setFontSize] = useState(48);
	const [opacity, setOpacity] = useState(0.3);
	const [rotation, setRotation] = useState(-30);
	const [color, setColor] = useState("#000000");
	const [mode, setMode] = useState<WatermarkMode>("center");

	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasResult = resultUrl !== null;

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFile(incoming[0]);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
	}, []);

	// Create original preview URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Determine output format from input MIME type
	const outputFormat =
		file?.type === "image/jpeg"
			? "image/jpeg"
			: file?.type === "image/webp"
				? "image/webp"
				: "image/png";

	// Process watermark
	useEffect(() => {
		if (!file || !text.trim()) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const result: WatermarkImageResult = await watermarkImage(file, {
					text,
					fontSize,
					opacity,
					rotation,
					color,
					mode,
					outputFormat,
					quality: 0.92,
					signal: controller.signal,
				});
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
					err instanceof Error ? err.message : "Watermark processing failed",
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
	}, [file, text, fontSize, opacity, rotation, color, mode, outputFormat]);

	const reset = useCallback(() => {
		setFile(null);
		setOriginalUrl(null);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		setText("SAMPLE");
		setFontSize(48);
		setOpacity(0.3);
		setRotation(-30);
		setColor("#000000");
		setMode("center");
	}, []);

	const outputFilename = file
		? file.name.replace(/\.[^.]+$/, "-watermarked$&")
		: "";

	return (
		<div className="space-y-6">
			{!file && (
				<div className="h-[460px]">
					<ToolDropzone
						accept={ACCEPT_IMAGES_RASTER}
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
							<label
								htmlFor="watermark-text"
								className="text-sm font-medium block mb-1"
							>
								Text
							</label>
							<Input
								id="watermark-text"
								type="text"
								value={text}
								onChange={(e) => setText(e.target.value)}
								className="w-48 h-9"
								placeholder="Watermark text"
							/>
						</div>

						<div>
							<label
								htmlFor="watermark-color"
								className="text-sm font-medium block mb-1"
							>
								Color
							</label>
							<input
								id="watermark-color"
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="h-9 w-12 cursor-pointer rounded border bg-card transition-none"
							/>
						</div>

						<div>
							<span className="text-sm font-medium block mb-1">Mode</span>
							<ToggleGroup
								type="single"
								value={mode}
								onValueChange={(v) => {
									if (v) setMode(v as WatermarkMode);
								}}
							>
								<ToggleGroupItem value="center" className="text-xs px-3 py-1.5">
									Center
								</ToggleGroupItem>
								<ToggleGroupItem value="tiled" className="text-xs px-3 py-1.5">
									Tiled
								</ToggleGroupItem>
							</ToggleGroup>
						</div>
					</div>

					<div className="space-y-4 max-w-sm">
						<div className="space-y-2">
							<span className="text-sm font-medium">
								Font size: {fontSize}px
							</span>
							<Slider
								aria-label="Font size"
								value={[fontSize]}
								onValueChange={(v) => setFontSize(v[0])}
								min={12}
								max={200}
								step={1}
							/>
						</div>

						<div className="space-y-2">
							<span className="text-sm font-medium">
								Opacity: {Math.round(opacity * 100)}%
							</span>
							<Slider
								aria-label="Opacity"
								value={[opacity * 100]}
								onValueChange={(v) => setOpacity(v[0] / 100)}
								min={10}
								max={100}
								step={1}
							/>
						</div>

						<div className="space-y-2">
							<span className="text-sm font-medium">Rotation: {rotation}°</span>
							<Slider
								aria-label="Rotation"
								value={[rotation]}
								onValueChange={(v) => setRotation(v[0])}
								min={-90}
								max={90}
								step={1}
							/>
						</div>
					</div>

					{/* Result label */}
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
									{file.name} — <Spinner className="size-3 inline" />{" "}
									Watermarking...
								</span>
								{resultBlob && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
										style={{ opacity: processing ? 0 : 1 }}
									>
										{formatFileSize(resultBlob.size)}
									</span>
								)}
							</p>
						</div>
					</div>

					{/* Preview */}
					{processing && !hasResult ? (
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
					) : null}

					{/* Actions */}
					<div className="flex items-center gap-3 h-9">
						{resultBlob && (
							<DownloadButton
								blob={resultBlob}
								filename={outputFilename}
								disabled={processing}
							/>
						)}
						<Button variant="outline" onClick={reset}>
							Watermark another
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
