import { AlertCircle, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
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
import { Spinner } from "~/components/ui/spinner";
import {
	loadPdfDocument,
	renderPdfPageToDataUrl,
} from "~/features/pdf-tools/lib/pdf-thumbnail";
import {
	type RotatePdfResult,
	type RotationAngle,
	rotatePdf,
} from "~/features/pdf-tools/processors/rotate-pdf";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

const ROTATION_OPTIONS: { value: string; label: string }[] = [
	{ value: "90", label: "90° clockwise" },
	{ value: "180", label: "180°" },
	{ value: "270", label: "90° counter-clockwise" },
];

function rotateFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-rotated.pdf`;
}

export default function PdfRotateTool() {
	const [file, setFile] = useState<File | null>(null);
	const [pageCount, setPageCount] = useState<number | null>(null);
	const [rotation, setRotation] = useState<RotationAngle>(90);

	const [processing, setProcessing] = useState(false);
	const [result, setResult] = useState<RotatePdfResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Preview state
	const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);
	const [previewPage, setPreviewPage] = useState(1);
	const [previewError, setPreviewError] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setResult(null);
			setError(null);
			setPageCount(null);
			setPreviewUrl(null);
			setPreviewPage(1);
			setPreviewError(null);
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
		setLoadingPreview(false);
		setPreviewError(null);
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

	// Effect B: pdfDoc + previewPage + rotation → render thumbnail
	useEffect(() => {
		if (!pdfDoc) return;

		const controller = new AbortController();
		setLoadingPreview(true);

		(async () => {
			try {
				const dataUrl = await renderPdfPageToDataUrl(pdfDoc, previewPage, {
					scale: 1.5,
					rotation,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setPreviewUrl(dataUrl);
				setLoadingPreview(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setPreviewError(
					err instanceof Error ? err.message : "Failed to render preview",
				);
				setLoadingPreview(false);
			}
		})();

		return () => controller.abort();
	}, [pdfDoc, previewPage, rotation]);

	// Effect C: auto-process when file or rotation changes
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const res = await rotatePdf(file, {
					rotation,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setResult(res);
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Rotation failed");
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file, rotation]);

	const hasPreview = previewUrl !== null;
	const previewOpacity =
		processing && !result ? 0.6 : processing && result ? 0.25 : 1;
	const showSpinner = processing || loadingPreview;

	return (
		<div className="space-y-6">
			{/* Rotation angle selector */}
			<div className="space-y-2">
				<span className="text-sm font-medium">Rotation</span>
				<Select
					value={String(rotation)}
					onValueChange={(v) => setRotation(Number(v) as RotationAngle)}
				>
					<SelectTrigger className="w-[240px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{ROTATION_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
								{/* Processing status — cross-fade */}
								<span
									className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
									style={{ opacity: processing ? 1 : 0 }}
								>
									<Spinner className="size-3" />
									Rotating...
								</span>
								{/* Result status — cross-fade */}
								{result && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
										style={{ opacity: processing ? 0 : 1 }}
									>
										{result.pageCount}{" "}
										{result.pageCount === 1 ? "page" : "pages"} rotated{" "}
										{result.rotation}°
									</span>
								)}
							</div>
						</div>

						{/* Preview area */}
						{previewError && !hasPreview ? (
							/* Preview-specific error (e.g. password-protected) — fallback */
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<p className="text-sm text-muted-foreground text-center px-8">
									{previewError}
								</p>
								{processing && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Spinner className="size-4" />
										Rotating pages...
									</div>
								)}
							</div>
						) : error ? (
							/* Processing error */
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
								<AlertCircle className="h-8 w-8 text-destructive" />
								<p className="text-sm text-destructive max-w-md text-center">
									{error}
								</p>
							</div>
						) : loadingPreview && !hasPreview ? (
							/* Initial preview loading */
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
								<Spinner className="size-8" />
								<p className="text-sm text-muted-foreground">
									Rendering preview...
								</p>
							</div>
						) : hasPreview ? (
							/* Preview with dimming during re-processing */
							<div className="relative">
								<div
									className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px] transition-opacity duration-300"
									style={{ opacity: previewOpacity }}
								>
									<img
										src={previewUrl}
										alt={`Page ${previewPage} rotated ${rotation}°`}
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
							/* Fallback: processing without preview */
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-4 px-8">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									Rotating pages...
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
							<div className="rounded-lg border bg-card p-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Pages</p>
										<p className="font-medium">{result.pageCount}</p>
									</div>
									<div>
										<p className="text-muted-foreground">Rotation applied</p>
										<p className="font-medium">{result.rotation}° clockwise</p>
									</div>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							{!processing && result && (
								<DownloadButton
									blob={result.blob}
									filename={rotateFilename(file.name)}
								/>
							)}
							<Button variant="outline" onClick={reset}>
								{result || error ? "Rotate another" : "Cancel"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
