import { AlertCircle, FileText, Scissors } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import {
	loadPdfDocument,
	renderPdfPageToDataUrl,
} from "~/features/pdf-tools/lib/pdf-thumbnail";
import {
	parsePageRanges,
	type SplitResult,
	splitPdf,
} from "~/features/pdf-tools/processors/split-pdf";
import { formatFileSize } from "~/lib/utils";

type SplitMode = "individual" | "custom";

const ACCEPT_PDF = { "application/pdf": [".pdf"] };
const MAX_THUMBNAILS = 50;

interface PageThumbnail {
	pageNumber: number;
	dataUrl: string;
}

/**
 * Parse a ranges string into a Set of 1-based page numbers.
 * Returns empty set on invalid input (no error thrown).
 */
function getSelectedPages(rangesStr: string, totalPages: number): Set<number> {
	if (!rangesStr.trim()) return new Set();
	try {
		const ranges = parsePageRanges(rangesStr, totalPages);
		const selected = new Set<number>();
		for (const range of ranges) {
			for (const idx of range.indices) {
				selected.add(idx + 1);
			}
		}
		return selected;
	} catch {
		return new Set();
	}
}

export default function PdfSplitTool() {
	const [file, setFile] = useState<File | null>(null);
	const [pageCount, setPageCount] = useState<number | null>(null);
	const [splitMode, setSplitMode] = useState<SplitMode>("individual");
	const [customRanges, setCustomRanges] = useState("");
	const [splitting, setSplitting] = useState(false);
	const [results, setResults] = useState<SplitResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState({ completed: 0, total: 0 });

	// Thumbnail state
	const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
	const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
	const [loadingThumbs, setLoadingThumbs] = useState(false);

	// Destroy pdfDoc when it changes or on unmount
	useEffect(() => {
		return () => {
			pdfDoc?.destroy();
		};
	}, [pdfDoc]);

	const handleFiles = useCallback((files: File[]) => {
		const selected = files[0];
		if (!selected) return;
		setFile(selected);
		setPageCount(null);
		setResults([]);
		setError(null);
		setThumbnails([]);
	}, []);

	// Load document + render thumbnails on file change
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();
		setLoadingThumbs(true);

		(async () => {
			try {
				const bytes = new Uint8Array(await file.arrayBuffer());
				if (controller.signal.aborted) return;

				const doc = await loadPdfDocument(bytes);
				if (controller.signal.aborted) {
					doc.destroy();
					return;
				}

				const count = doc.numPages;
				setPdfDoc(doc);
				setPageCount(count);

				// Render thumbnails progressively
				const thumbs: PageThumbnail[] = [];
				const renderCount = Math.min(count, MAX_THUMBNAILS);
				for (let i = 1; i <= renderCount; i++) {
					if (controller.signal.aborted) break;
					const dataUrl = await renderPdfPageToDataUrl(doc, i, {
						scale: 0.3,
						format: "jpeg",
						quality: 0.7,
						signal: controller.signal,
					});
					thumbs.push({ pageNumber: i, dataUrl });
					// Update state every 6 pages (one grid row) or on last page
					if (i % 6 === 0 || i === renderCount) {
						setThumbnails([...thumbs]);
					}
				}

				if (!controller.signal.aborted) setLoadingThumbs(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Failed to load PDF");
				setLoadingThumbs(false);
			}
		})();

		return () => {
			controller.abort();
		};
	}, [file]);

	const handleSplit = useCallback(async () => {
		if (!file) return;
		setSplitting(true);
		setResults([]);
		setError(null);
		setProgress({ completed: 0, total: 0 });

		try {
			const parts = await splitPdf(
				file,
				{ ranges: splitMode === "custom" ? customRanges : "" },
				(completed, total) => setProgress({ completed, total }),
			);
			setResults(parts);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Split failed");
		} finally {
			setSplitting(false);
		}
	}, [file, splitMode, customRanges]);

	const handleReset = useCallback(() => {
		setFile(null);
		setPageCount(null);
		setSplitMode("individual");
		setCustomRanges("");
		setResults([]);
		setError(null);
		setSplitting(false);
		setProgress({ completed: 0, total: 0 });
		setThumbnails([]);
		setLoadingThumbs(false);
		setPdfDoc(null);
	}, []);

	const hasFile = file !== null;
	const canSplit =
		hasFile &&
		!splitting &&
		pageCount !== null &&
		(splitMode === "individual" || customRanges.trim().length > 0);

	// Pages highlighted in the thumbnail grid
	const selectedPages = useMemo(() => {
		if (!pageCount) return new Set<number>();
		if (splitMode === "individual") {
			// All pages selected
			return new Set(Array.from({ length: pageCount }, (_, i) => i + 1));
		}
		return getSelectedPages(customRanges, pageCount);
	}, [splitMode, customRanges, pageCount]);

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
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

						{/* Thumbnail grid */}
						{loadingThumbs && thumbnails.length === 0 && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[200px] gap-3">
								<Spinner className="size-8" />
								<p className="text-sm text-muted-foreground">
									Rendering page thumbnails...
								</p>
							</div>
						)}

						{thumbnails.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm font-medium">
									Pages
									{loadingThumbs && <Spinner className="size-3 inline ml-2" />}
								</p>
								<ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 list-none p-0 m-0">
									{thumbnails.map((thumb) => {
										const isSelected = selectedPages.has(thumb.pageNumber);
										return (
											<li
												key={thumb.pageNumber}
												className={`relative rounded-lg border overflow-hidden transition-all ${
													isSelected
														? "ring-2 ring-primary border-primary/40"
														: "border-border"
												}`}
											>
												<div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
													{thumb.pageNumber}
												</div>
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
								{pageCount !== null && pageCount > MAX_THUMBNAILS && (
									<p className="text-xs text-muted-foreground text-center">
										Showing first {MAX_THUMBNAILS} of {pageCount} pages
									</p>
								)}
							</div>
						)}

						{/* Split mode selector */}
						<div className="space-y-3">
							<p className="text-sm font-medium">Split mode</p>
							<div className="flex gap-3">
								<Button
									variant={splitMode === "individual" ? "default" : "outline"}
									size="sm"
									onClick={() => setSplitMode("individual")}
									disabled={splitting}
								>
									Individual pages
								</Button>
								<Button
									variant={splitMode === "custom" ? "default" : "outline"}
									size="sm"
									onClick={() => setSplitMode("custom")}
									disabled={splitting}
								>
									Custom ranges
								</Button>
							</div>

							{splitMode === "custom" && (
								<div className="space-y-1.5">
									<Input
										type="text"
										placeholder={`e.g. 1-3, 5, 7-${pageCount ?? 10}`}
										value={customRanges}
										onChange={(e) => setCustomRanges(e.target.value)}
										disabled={splitting}
									/>
									<p className="text-xs text-muted-foreground">
										Enter page numbers or ranges separated by commas. Each range
										produces a separate PDF.
									</p>
								</div>
							)}
						</div>

						{/* Progress */}
						{splitting && (
							<ToolProgress
								message={`Splitting part ${progress.completed} of ${progress.total}...`}
								value={
									progress.total > 0
										? Math.round((progress.completed / progress.total) * 100)
										: undefined
								}
							/>
						)}

						{/* Error */}
						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-destructive shrink-0" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						{/* Results */}
						{results.length > 0 && (
							<div className="space-y-2">
								<p className="text-sm font-medium">
									{results.length} {results.length === 1 ? "file" : "files"}{" "}
									ready
								</p>
								{results.map((r) => (
									<div
										key={r.filename}
										className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3"
									>
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">{r.label}</p>
											<p className="text-xs text-muted-foreground">
												{r.pageCount} {r.pageCount === 1 ? "page" : "pages"}{" "}
												&middot; {formatFileSize(r.blob.size)}
											</p>
										</div>
										<DownloadButton blob={r.blob} filename={r.filename} />
									</div>
								))}
								<div className="pt-2">
									<Button variant="outline" onClick={handleReset}>
										Split another PDF
									</Button>
								</div>
							</div>
						)}

						{/* Action buttons */}
						{results.length === 0 && !splitting && (
							<div className="flex items-center gap-3">
								<Button
									onClick={handleSplit}
									disabled={!canSplit}
									className="gap-2"
								>
									<Scissors className="h-4 w-4" />
									{splitMode === "individual"
										? `Split into ${pageCount ?? "..."} pages`
										: "Split PDF"}
								</Button>
								<Button variant="outline" onClick={handleReset}>
									Reset
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
