import { AlertCircle, FileText, Scissors } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	getPdfPageCount,
	type SplitResult,
	splitPdf,
} from "~/features/pdf-tools/processors/split-pdf";
import { formatFileSize } from "~/lib/utils";

type SplitMode = "individual" | "custom";

const ACCEPT_PDF = { "application/pdf": [".pdf"] };

export default function PdfSplitTool() {
	const [file, setFile] = useState<File | null>(null);
	const [pageCount, setPageCount] = useState<number | null>(null);
	const [splitMode, setSplitMode] = useState<SplitMode>("individual");
	const [customRanges, setCustomRanges] = useState("");
	const [splitting, setSplitting] = useState(false);
	const [results, setResults] = useState<SplitResult[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState({ completed: 0, total: 0 });
	const controllerRef = useRef<AbortController | null>(null);

	// Abort on unmount
	useEffect(() => {
		return () => controllerRef.current?.abort();
	}, []);

	const handleFiles = useCallback((files: File[]) => {
		const selected = files[0];
		if (!selected) return;
		setFile(selected);
		setPageCount(null);
		setResults([]);
		setError(null);

		getPdfPageCount(selected)
			.then((count) => setPageCount(count))
			.catch(() => setError("Could not read PDF page count"));
	}, []);

	const handleSplit = useCallback(async () => {
		if (!file) return;
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		setSplitting(true);
		setResults([]);
		setError(null);
		setProgress({ completed: 0, total: 0 });

		try {
			const parts = await splitPdf(
				file,
				{
					ranges: splitMode === "custom" ? customRanges : "",
					signal: controller.signal,
				},
				(completed, total) => setProgress({ completed, total }),
			);
			if (controller.signal.aborted) return;
			setResults(parts);
		} catch (err) {
			if (controller.signal.aborted) return;
			setError(err instanceof Error ? err.message : "Split failed");
		} finally {
			if (!controller.signal.aborted) setSplitting(false);
		}
	}, [file, splitMode, customRanges]);

	const handleReset = useCallback(() => {
		controllerRef.current?.abort();
		setFile(null);
		setPageCount(null);
		setSplitMode("individual");
		setCustomRanges("");
		setResults([]);
		setError(null);
		setSplitting(false);
		setProgress({ completed: 0, total: 0 });
	}, []);

	const hasFile = file !== null;
	const canSplit =
		hasFile &&
		!splitting &&
		pageCount !== null &&
		(splitMode === "individual" || customRanges.trim().length > 0);

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
