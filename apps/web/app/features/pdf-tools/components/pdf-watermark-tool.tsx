import { AlertCircle, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import {
	type WatermarkPdfResult,
	watermarkPdf,
} from "~/features/pdf-tools/processors/watermark-pdf";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

function watermarkFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-watermarked.pdf`;
}

function hexToLabel(hex: string): string {
	return hex.toUpperCase();
}

export default function PdfWatermarkTool() {
	const [file, setFile] = useState<File | null>(null);
	const [text, setText] = useState("CONFIDENTIAL");
	const [fontSize, setFontSize] = useState(60);
	const [opacity, setOpacity] = useState(0.3);
	const [rotation, setRotation] = useState(45);
	const [color, setColor] = useState("#808080");

	const [processing, setProcessing] = useState(false);
	const [result, setResult] = useState<WatermarkPdfResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setResult(null);
			setError(null);
		}
	}, []);

	const reset = useCallback(() => {
		setFile(null);
		setResult(null);
		setError(null);
		setProcessing(false);
	}, []);

	// Auto-process when file or settings change
	useEffect(() => {
		if (!file) return;
		if (!text.trim()) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const res = await watermarkPdf(file, {
					text: text.trim(),
					fontSize,
					opacity,
					rotation,
					color,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setResult(res);
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Watermarking failed");
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file, text, fontSize, opacity, rotation, color]);

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="space-y-4">
				<div className="space-y-2">
					<span className="text-sm font-medium">Watermark Text</span>
					<Input
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Enter watermark text"
						maxLength={100}
					/>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Font Size</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{fontSize}px
							</span>
						</div>
						<Slider
							value={[fontSize]}
							onValueChange={([v]) => setFontSize(v)}
							min={20}
							max={120}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Opacity</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{Math.round(opacity * 100)}%
							</span>
						</div>
						<Slider
							value={[opacity]}
							onValueChange={([v]) => setOpacity(v)}
							min={0.1}
							max={1.0}
							step={0.05}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Rotation</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{rotation}°
							</span>
						</div>
						<Slider
							value={[rotation]}
							onValueChange={([v]) => setRotation(v)}
							min={-90}
							max={90}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<span className="text-sm font-medium">Color</span>
						<div className="flex items-center gap-2">
							<input
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								className="h-9 w-9 rounded border border-input cursor-pointer"
								aria-label="Watermark color"
							/>
							<Input
								value={color}
								onChange={(e) => {
									const v = e.target.value;
									if (/^#[0-9a-fA-F]{6}$/.test(v)) {
										setColor(v);
									}
								}}
								placeholder="#808080"
								className="w-[120px] font-mono"
								maxLength={7}
							/>
							<span className="text-xs text-muted-foreground">
								{hexToLabel(color)}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="min-h-[460px]">
				{/* Idle: show dropzone */}
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_PDF} onFiles={handleFiles} />
					</div>
				)}

				{/* File selected: show result area */}
				{file && (
					<div className="space-y-4">
						{/* Original file info */}
						<div className="rounded-lg border bg-card p-4">
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5 text-muted-foreground shrink-0" />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium truncate">{file.name}</p>
									<p className="text-xs text-muted-foreground">
										Original: {formatFileSize(file.size)}
									</p>
								</div>
							</div>
						</div>

						{/* Result label — always visible once file is selected */}
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Result</h3>
							<div className="relative">
								{/* Processing status — cross-fade */}
								<span
									className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
									style={{ opacity: processing ? 1 : 0 }}
								>
									<Spinner className="size-3" />
									Adding watermark...
								</span>
								{/* Result status — cross-fade */}
								{result && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
										style={{ opacity: processing ? 0 : 1 }}
									>
										{formatFileSize(result.watermarkedSize)} —{" "}
										{result.pageCount}{" "}
										{result.pageCount === 1 ? "page" : "pages"} watermarked
									</span>
								)}
							</div>
						</div>

						{/* Processing state */}
						{processing && !result && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[300px] gap-4 px-8">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									Adding watermark to PDF...
								</div>
							</div>
						)}

						{/* Re-processing overlay: dim previous result */}
						{processing && result && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[200px] gap-3 opacity-50 transition-opacity duration-300">
								<Spinner className="size-8" />
								<p className="text-sm text-muted-foreground">
									Re-processing with new settings...
								</p>
							</div>
						)}

						{/* Error state */}
						{!processing && error && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[200px] gap-3">
								<AlertCircle className="h-8 w-8 text-destructive" />
								<p className="text-sm text-destructive max-w-md text-center">
									{error}
								</p>
							</div>
						)}

						{/* Done state */}
						{!processing && result && (
							<div className="rounded-lg border bg-card p-4 space-y-3">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Original</p>
										<p className="font-medium">
											{formatFileSize(result.originalSize)}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Watermarked</p>
										<p className="font-medium">
											{formatFileSize(result.watermarkedSize)}
										</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{result.pageCount} {result.pageCount === 1 ? "page" : "pages"}{" "}
									watermarked with "{text}"
								</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							{!processing && result && (
								<DownloadButton
									blob={result.blob}
									filename={watermarkFilename(file.name)}
								/>
							)}
							<Button variant="outline" onClick={reset}>
								{result || error ? "Watermark another" : "Cancel"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
