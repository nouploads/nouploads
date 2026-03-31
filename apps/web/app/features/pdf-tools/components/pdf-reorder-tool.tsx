import { AlertCircle, Download, FileText, GripVertical, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import {
	getPdfPageCount,
	reorderPdf,
} from "~/features/pdf-tools/processors/reorder-pdf";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

let pdfjsReady: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
	if (pdfjsReady) return pdfjsReady;
	const pdfjsLib = await import("pdfjs-dist");
	pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
		"pdfjs-dist/build/pdf.worker.min.mjs",
		import.meta.url,
	).href;
	pdfjsReady = pdfjsLib;
	return pdfjsLib;
}

interface PageThumbnail {
	/** 0-based page index in the original document */
	originalIndex: number;
	/** 1-indexed page number for display */
	pageNumber: number;
	/** Data URL of the rendered thumbnail */
	dataUrl: string;
}

function reorderFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-reordered.pdf`;
}

export default function PdfReorderTool() {
	const [file, setFile] = useState<File | null>(null);
	const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
	const [pageCount, setPageCount] = useState<number | null>(null);
	const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
	const [pageOrder, setPageOrder] = useState<number[]>([]);
	const [loading, setLoading] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);

	const controllerRef = useRef<AbortController | null>(null);
	const dragItemRef = useRef<number | null>(null);
	const dragOverItemRef = useRef<number | null>(null);

	// Abort on unmount
	useEffect(() => {
		return () => controllerRef.current?.abort();
	}, []);

	const handleFiles = useCallback(async (files: File[]) => {
		const selected = files[0];
		if (!selected) return;

		setFile(selected);
		setThumbnails([]);
		setPageOrder([]);
		setResultBlob(null);
		setError(null);
		setLoading(true);

		try {
			const bytes = new Uint8Array(await selected.arrayBuffer());
			setPdfBytes(bytes);

			const count = await getPdfPageCount(bytes);
			setPageCount(count);
			setPageOrder(Array.from({ length: count }, (_, i) => i));

			// Render thumbnails
			const pdfjsLib = await getPdfjs();
			const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
			const thumbs: PageThumbnail[] = [];

			for (let i = 1; i <= count; i++) {
				const page = await pdf.getPage(i);
				const viewport = page.getViewport({ scale: 0.3 });
				const canvas = document.createElement("canvas");
				canvas.width = Math.floor(viewport.width);
				canvas.height = Math.floor(viewport.height);
				const ctx = canvas.getContext("2d");
				if (!ctx) continue;

				ctx.fillStyle = "#ffffff";
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				await page.render({
					canvasContext: ctx,
					viewport,
					canvas,
				} as never).promise;

				thumbs.push({
					originalIndex: i - 1,
					pageNumber: i,
					dataUrl: canvas.toDataURL("image/jpeg", 0.7),
				});
			}

			setThumbnails(thumbs);
			setLoading(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load PDF");
			setLoading(false);
		}
	}, []);

	const handleRemovePage = useCallback(
		(orderIndex: number) => {
			if (pageOrder.length <= 1) return; // Don't remove last page
			setPageOrder((prev) => prev.filter((_, i) => i !== orderIndex));
			setResultBlob(null);
		},
		[pageOrder.length],
	);

	const handleReset = useCallback(() => {
		if (pageCount === null) return;
		setPageOrder(Array.from({ length: pageCount }, (_, i) => i));
		setResultBlob(null);
	}, [pageCount]);

	const handleFullReset = useCallback(() => {
		controllerRef.current?.abort();
		setFile(null);
		setPdfBytes(null);
		setPageCount(null);
		setThumbnails([]);
		setPageOrder([]);
		setLoading(false);
		setProcessing(false);
		setResultBlob(null);
		setError(null);
	}, []);

	// Drag and drop handlers
	const handleDragStart = useCallback(
		(e: React.DragEvent<HTMLDivElement>, index: number) => {
			dragItemRef.current = index;
			e.dataTransfer.effectAllowed = "move";
			// Make the dragged element semi-transparent
			if (e.currentTarget instanceof HTMLElement) {
				e.currentTarget.style.opacity = "0.5";
			}
		},
		[],
	);

	const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		if (e.currentTarget instanceof HTMLElement) {
			e.currentTarget.style.opacity = "1";
		}
		dragItemRef.current = null;
		dragOverItemRef.current = null;
	}, []);

	const handleDragOver = useCallback(
		(e: React.DragEvent<HTMLDivElement>, index: number) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			dragOverItemRef.current = index;
		},
		[],
	);

	const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const from = dragItemRef.current;
		const to = dragOverItemRef.current;

		if (from === null || to === null || from === to) return;

		setPageOrder((prev) => {
			const updated = [...prev];
			const [moved] = updated.splice(from, 1);
			updated.splice(to, 0, moved);
			return updated;
		});
		setResultBlob(null);

		dragItemRef.current = null;
		dragOverItemRef.current = null;
	}, []);

	// Build PDF with new order
	const handleBuild = useCallback(async () => {
		if (!pdfBytes || pageOrder.length === 0) return;

		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;

		setProcessing(true);
		setError(null);
		setResultBlob(null);

		try {
			const output = await reorderPdf(pdfBytes, pageOrder, controller.signal);
			if (controller.signal.aborted) return;

			const blob = new Blob([output as BlobPart], {
				type: "application/pdf",
			});
			setResultBlob(blob);
		} catch (err) {
			if (controller.signal.aborted) return;
			setError(err instanceof Error ? err.message : "Reordering failed");
		} finally {
			if (!controller.signal.aborted) setProcessing(false);
		}
	}, [pdfBytes, pageOrder]);

	const hasFile = file !== null;
	const isOrderChanged =
		pageCount !== null &&
		(pageOrder.length !== pageCount || pageOrder.some((v, i) => v !== i));

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{/* Idle: show dropzone */}
				{!hasFile && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_PDF} onFiles={handleFiles} />
					</div>
				)}

				{hasFile && file && (
					<div className="space-y-4">
						{/* File info */}
						<div className="flex items-center justify-between rounded-lg border bg-card p-3 gap-3">
							<div className="flex items-center gap-3 min-w-0">
								<FileText className="h-4 w-4 text-muted-foreground shrink-0" />
								<div className="min-w-0">
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

						{/* Loading state */}
						{loading && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[300px] gap-4">
								<Spinner className="size-8" />
								<p className="text-sm text-muted-foreground">
									Rendering page thumbnails...
								</p>
							</div>
						)}

						{/* Error */}
						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-destructive shrink-0" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						{/* Thumbnail grid */}
						{!loading && thumbnails.length > 0 && (
							<>
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium">
										{pageOrder.length}{" "}
										{pageOrder.length === 1 ? "page" : "pages"}
										{isOrderChanged && (
											<span className="text-muted-foreground"> (modified)</span>
										)}
									</p>
									{isOrderChanged && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleReset}
											disabled={processing}
										>
											Reset order
										</Button>
									)}
								</div>

								<ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 list-none p-0 m-0">
									{pageOrder.map((originalIdx, orderIdx) => {
										const thumb = thumbnails.find(
											(t) => t.originalIndex === originalIdx,
										);
										if (!thumb) return null;

										return (
											<li
												// biome-ignore lint/suspicious/noArrayIndexKey: drag-and-drop reorder requires index-based keys to reflect position changes
												key={orderIdx}
												draggable
												onDragStart={(e) => handleDragStart(e, orderIdx)}
												onDragEnd={handleDragEnd}
												onDragOver={(e) => handleDragOver(e, orderIdx)}
												onDrop={handleDrop}
												className="group relative rounded-lg border bg-card overflow-hidden cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md hover:border-primary/40"
											>
												{/* Page number badge */}
												<div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
													{thumb.pageNumber}
												</div>

												{/* Remove button */}
												{pageOrder.length > 1 && (
													<button
														type="button"
														onClick={() => handleRemovePage(orderIdx)}
														disabled={processing}
														className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-destructive p-0.5 text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity"
														aria-label={`Remove page ${thumb.pageNumber}`}
													>
														<X className="h-3 w-3" />
													</button>
												)}

												{/* Grip icon */}
												<div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1 py-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
													<GripVertical className="h-3 w-3 text-white" />
												</div>

												{/* Thumbnail image */}
												<img
													src={thumb.dataUrl}
													alt={`Page ${thumb.pageNumber}`}
													className="w-full h-auto"
													draggable={false}
												/>
											</li>
										);
									})}
								</ul>
							</>
						)}

						{/* Result section */}
						{!loading && thumbnails.length > 0 && (
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium">Result</h3>
								<div className="relative">
									{/* Processing status -- cross-fade */}
									<span
										className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
										style={{
											opacity: processing ? 1 : 0,
										}}
									>
										<Spinner className="size-3" />
										Reordering...
									</span>
									{/* Result status -- cross-fade */}
									{resultBlob && (
										<span
											className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
											style={{
												opacity: processing ? 0 : 1,
											}}
										>
											{pageOrder.length}{" "}
											{pageOrder.length === 1 ? "page" : "pages"} &middot;{" "}
											{formatFileSize(resultBlob.size)}
										</span>
									)}
								</div>
							</div>
						)}

						{/* Action buttons */}
						{!loading && thumbnails.length > 0 && (
							<div className="flex items-center gap-3">
								{!resultBlob && (
									<Button
										onClick={handleBuild}
										disabled={processing || pageOrder.length === 0}
										className="gap-2"
									>
										{processing ? (
											<>
												<Spinner className="size-4" />
												Reordering...
											</>
										) : (
											<>
												<Download className="h-4 w-4" />
												{isOrderChanged
													? "Build Reordered PDF"
													: "Download PDF"}
											</>
										)}
									</Button>
								)}
								{resultBlob && !processing && (
									<DownloadButton
										blob={resultBlob}
										filename={reorderFilename(file.name)}
									/>
								)}
								<Button
									variant="outline"
									onClick={handleFullReset}
									disabled={processing}
								>
									{resultBlob ? "Reorder another" : "Cancel"}
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
