import { AlertCircle, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import {
	loadPdfDocument,
	renderPdfPageToCanvas,
} from "~/features/pdf-tools/lib/pdf-thumbnail";
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

/**
 * Draw a watermark overlay on a canvas that already has the PDF page rendered.
 * Matches the positioning logic in the core watermark-pdf tool (centered text
 * with rotation), adapted for canvas coordinates (y-axis is flipped vs PDF).
 */
function drawWatermarkOverlay(
	canvas: HTMLCanvasElement,
	scale: number,
	wm: {
		text: string;
		fontSize: number;
		opacity: number;
		rotation: number;
		color: string;
	},
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const scaledFontSize = wm.fontSize * scale;

	ctx.save();
	ctx.translate(canvas.width / 2, canvas.height / 2);
	// pdf-lib rotates counter-clockwise in PDF coords (y-up).
	// Canvas y-axis is down, so negate the angle to match visually.
	ctx.rotate((-wm.rotation * Math.PI) / 180);
	ctx.font = `${scaledFontSize}px Helvetica, Arial, sans-serif`;
	ctx.fillStyle = wm.color;
	ctx.globalAlpha = wm.opacity;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(wm.text, 0, 0);
	ctx.restore();
}

const PREVIEW_SCALE = 1.0;

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

	// Preview state
	const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
	const [pageCount, setPageCount] = useState<number | null>(null);
	const [previewPage, setPreviewPage] = useState(1);
	const [previewError, setPreviewError] = useState<string | null>(null);

	// Base page canvas cached separately so watermark overlay redraws are instant
	const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);
	const [loadingBase, setLoadingBase] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// Track which page the cached base canvas is for
	const baseCacheRef = useRef<{ page: number } | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setResult(null);
			setError(null);
			setPageCount(null);
			setPreviewUrl(null);
			setPreviewPage(1);
			setPreviewError(null);
			setBaseCanvas(null);
			baseCacheRef.current = null;
		}
	}, []);

	const reset = useCallback(() => {
		setFile(null);
		setResult(null);
		setError(null);
		setProcessing(false);
		setPageCount(null);
		setPreviewUrl(null);
		setPreviewPage(1);
		setPreviewError(null);
		setBaseCanvas(null);
		baseCacheRef.current = null;
		setPdfDoc(null);
	}, []);

	// Destroy pdfDoc when it changes or on unmount
	useEffect(() => {
		return () => {
			pdfDoc?.destroy();
		};
	}, [pdfDoc]);

	// Effect A: file → load PDF document → pdfDoc + pageCount
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();

		(async () => {
			try {
				const bytes = new Uint8Array(await file.arrayBuffer());
				if (controller.signal.aborted) return;

				const doc = await loadPdfDocument(bytes);
				if (controller.signal.aborted) {
					doc.destroy();
					return;
				}

				setPageCount(doc.numPages);
				setPdfDoc(doc);
			} catch (err) {
				if (controller.signal.aborted) return;
				const errName = (err as { name?: string })?.name;
				if (errName === "PasswordException") {
					setPreviewError("Preview unavailable for password-protected PDFs");
				} else {
					setPreviewError(
						err instanceof Error ? err.message : "Failed to load PDF preview",
					);
				}
			}
		})();

		return () => {
			controller.abort();
		};
	}, [file]);

	// Effect B1: pdfDoc + previewPage → render base page canvas (slow, ~100ms)
	useEffect(() => {
		if (!pdfDoc) return;

		const controller = new AbortController();
		setLoadingBase(true);
		baseCacheRef.current = null;

		(async () => {
			try {
				const canvas = await renderPdfPageToCanvas(pdfDoc, previewPage, {
					scale: PREVIEW_SCALE,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				baseCacheRef.current = { page: previewPage };
				setBaseCanvas(canvas);
				setLoadingBase(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setPreviewError(
					err instanceof Error ? err.message : "Failed to render preview",
				);
				setLoadingBase(false);
			}
		})();

		return () => controller.abort();
	}, [pdfDoc, previewPage]);

	// Effect B2: baseCanvas + watermark params → compose overlay → previewUrl (instant)
	useEffect(() => {
		if (!baseCanvas) return;

		const output = document.createElement("canvas");
		output.width = baseCanvas.width;
		output.height = baseCanvas.height;
		const ctx = output.getContext("2d");
		if (!ctx) return;

		// Draw cached base page
		ctx.drawImage(baseCanvas, 0, 0);

		// Draw watermark overlay
		if (text.trim()) {
			drawWatermarkOverlay(output, PREVIEW_SCALE, {
				text: text.trim(),
				fontSize,
				opacity,
				rotation,
				color,
			});
		}

		setPreviewUrl(output.toDataURL("image/png"));
	}, [baseCanvas, text, fontSize, opacity, rotation, color]);

	// Effect C: auto-process when file or settings change
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

	const hasPreview = previewUrl !== null;
	const showSpinner = processing || loadingBase;

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

				{/* File selected */}
				{file && (
					<div className="space-y-4">
						{/* Original file info */}
						<div className="rounded-lg border bg-card p-4">
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5 text-muted-foreground shrink-0" />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium truncate">{file.name}</p>
									<p className="text-xs text-muted-foreground">
										{formatFileSize(file.size)}
										{pageCount !== null && (
											<>
												{" "}
												&middot; {pageCount}{" "}
												{pageCount === 1 ? "page" : "pages"}
											</>
										)}
									</p>
								</div>
							</div>
						</div>

						{/* Result label — always visible once file is selected */}
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Result</h3>
							<div className="relative">
								<span
									className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
									style={{ opacity: processing ? 1 : 0 }}
								>
									<Spinner className="size-3" />
									Adding watermark...
								</span>
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

						{/* Preview area */}
						{previewError && !hasPreview ? (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<p className="text-sm text-muted-foreground text-center px-8">
									{previewError}
								</p>
								{processing && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Spinner className="size-4" />
										Adding watermark...
									</div>
								)}
							</div>
						) : error ? (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
								<AlertCircle className="h-8 w-8 text-destructive" />
								<p className="text-sm text-destructive max-w-md text-center">
									{error}
								</p>
							</div>
						) : loadingBase && !hasPreview ? (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
								<Spinner className="size-8" />
								<p className="text-sm text-muted-foreground">
									Rendering preview...
								</p>
							</div>
						) : hasPreview ? (
							<div className="relative">
								<div
									className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px] transition-opacity duration-300"
									style={{
										opacity:
											processing && !result
												? 0.6
												: processing && result
													? 0.25
													: 1,
									}}
								>
									<img
										src={previewUrl}
										alt={`Page ${previewPage} with watermark`}
										className="max-w-full max-h-full object-contain"
									/>
								</div>
								<div
									className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
									style={{ opacity: showSpinner ? 1 : 0 }}
								>
									<Spinner className="size-10" />
								</div>
							</div>
						) : (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-4 px-8">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									Adding watermark...
								</div>
							</div>
						)}

						{/* Page navigation — only for multi-page PDFs */}
						{pageCount !== null && pageCount > 1 && (
							<div className="flex items-center justify-center gap-2">
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
									disabled={previewPage <= 1}
									onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
									aria-label="Previous page"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<span
									className="text-sm text-muted-foreground tabular-nums min-w-[100px] text-center"
									aria-live="polite"
								>
									Page {previewPage} of {pageCount}
								</span>
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
									disabled={previewPage >= pageCount}
									onClick={() =>
										setPreviewPage((p) => Math.min(pageCount, p + 1))
									}
									aria-label="Next page"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						)}

						{/* Stats row when done */}
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
