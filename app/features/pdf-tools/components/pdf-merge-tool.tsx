import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	FileText,
	Plus,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import {
	getPdfPageCount,
	mergePdfs,
} from "~/features/pdf-tools/processors/merge-pdf";
import { formatFileSize } from "~/lib/utils";

interface PdfFileEntry {
	file: File;
	pageCount: number | null;
}

const ACCEPT_PDF = { "application/pdf": [".pdf"] };

// ─── File list with reorder/remove controls ──────────────────

function FileList({
	entries,
	onReorder,
	onRemove,
}: {
	entries: PdfFileEntry[];
	onReorder: (fromIndex: number, toIndex: number) => void;
	onRemove: (index: number) => void;
}) {
	return (
		<div className="space-y-2">
			{entries.map((entry, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: files can share names; index disambiguates
				<div
					key={`${entry.file.name}-${entry.file.size}-${entry.file.lastModified}-${i}`}
					className="flex items-center justify-between rounded-lg border bg-card p-3 gap-3"
				>
					<div className="flex items-center gap-3 min-w-0">
						<span className="text-xs text-muted-foreground font-mono w-6 text-right shrink-0">
							{i + 1}
						</span>
						<FileText className="h-4 w-4 text-muted-foreground shrink-0" />
						<div className="min-w-0">
							<p className="text-sm font-medium truncate">{entry.file.name}</p>
							<p className="text-xs text-muted-foreground">
								{formatFileSize(entry.file.size)}
								{entry.pageCount !== null && (
									<>
										{" "}
										&middot; {entry.pageCount}{" "}
										{entry.pageCount === 1 ? "page" : "pages"}
									</>
								)}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-1 shrink-0">
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => onReorder(i, i - 1)}
							disabled={i === 0}
							aria-label={`Move ${entry.file.name} up`}
						>
							<ArrowUp className="h-3 w-3" />
						</Button>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => onReorder(i, i + 1)}
							disabled={i === entries.length - 1}
							aria-label={`Move ${entry.file.name} down`}
						>
							<ArrowDown className="h-3 w-3" />
						</Button>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => onRemove(i)}
							aria-label={`Remove ${entry.file.name}`}
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────

export default function PdfMergeTool() {
	const [entries, setEntries] = useState<PdfFileEntry[]>([]);
	const [merging, setMerging] = useState(false);
	const [result, setResult] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState({ completed: 0, total: 0 });
	const controllerRef = useRef<AbortController | null>(null);
	const addInputRef = useRef<HTMLInputElement>(null);

	// Abort on unmount
	useEffect(() => {
		return () => controllerRef.current?.abort();
	}, []);

	const addFiles = useCallback((incoming: File[]) => {
		const newEntries = incoming.map((file) => ({
			file,
			pageCount: null as number | null,
		}));
		setEntries((prev) => [...prev, ...newEntries]);
		// Reset any previous result when files change
		setResult(null);
		setError(null);

		// Read page counts in the background
		for (const entry of newEntries) {
			getPdfPageCount(entry.file)
				.then((count) => {
					setEntries((prev) =>
						prev.map((e) =>
							e.file === entry.file ? { ...e, pageCount: count } : e,
						),
					);
				})
				.catch(() => {
					// Page count detection failed — leave as null
				});
		}
	}, []);

	const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
		setEntries((prev) => {
			const next = [...prev];
			const [item] = next.splice(fromIndex, 1);
			next.splice(toIndex, 0, item);
			return next;
		});
		setResult(null);
		setError(null);
	}, []);

	const handleRemove = useCallback((index: number) => {
		setEntries((prev) => prev.filter((_, i) => i !== index));
		setResult(null);
		setError(null);
	}, []);

	const handleMerge = useCallback(async () => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		setMerging(true);
		setResult(null);
		setError(null);
		setProgress({ completed: 0, total: entries.length });

		try {
			const blob = await mergePdfs(
				entries.map((e) => e.file),
				{ signal: controller.signal },
				(completed, total) => setProgress({ completed, total }),
			);
			if (controller.signal.aborted) return;
			setResult(blob);
		} catch (err) {
			if (controller.signal.aborted) return;
			setError(err instanceof Error ? err.message : "Merge failed");
		} finally {
			if (!controller.signal.aborted) setMerging(false);
		}
	}, [entries]);

	const handleReset = useCallback(() => {
		controllerRef.current?.abort();
		setEntries([]);
		setResult(null);
		setError(null);
		setMerging(false);
		setProgress({ completed: 0, total: 0 });
	}, []);

	const handleAddMore = useCallback(() => {
		addInputRef.current?.click();
	}, []);

	const handleAddInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const fileList = e.target.files;
			if (fileList && fileList.length > 0) {
				addFiles(Array.from(fileList));
			}
			// Reset input so the same files can be selected again
			e.target.value = "";
		},
		[addFiles],
	);

	const hasFiles = entries.length > 0;
	const canMerge = entries.length >= 2 && !merging;

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{!hasFiles && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_PDF} onFiles={addFiles} multiple />
					</div>
				)}

				{hasFiles && (
					<div className="space-y-4">
						<FileList
							entries={entries}
							onReorder={handleReorder}
							onRemove={handleRemove}
						/>

						{/* Hidden input for "Add more files" */}
						<input
							ref={addInputRef}
							type="file"
							accept="application/pdf,.pdf"
							multiple
							onChange={handleAddInputChange}
							className="hidden"
						/>

						<div className="flex flex-wrap items-center gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={handleAddMore}
								disabled={merging}
								className="gap-1.5"
							>
								<Plus className="h-3.5 w-3.5" />
								Add more files
							</Button>
						</div>

						{merging && (
							<ToolProgress
								message={`Merging file ${progress.completed} of ${progress.total}...`}
								value={
									progress.total > 0
										? Math.round((progress.completed / progress.total) * 100)
										: undefined
								}
							/>
						)}

						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-center gap-2">
								<AlertCircle className="h-4 w-4 text-destructive shrink-0" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						{result && (
							<div className="rounded-lg border bg-card p-4 space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium">Merged PDF</p>
									<p className="text-xs text-muted-foreground">
										{formatFileSize(result.size)}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<DownloadButton blob={result} filename="merged.pdf" />
									<Button variant="outline" onClick={handleReset}>
										Merge more
									</Button>
								</div>
							</div>
						)}

						{!result && !merging && (
							<div className="flex items-center gap-3">
								<Button
									onClick={handleMerge}
									disabled={!canMerge}
									className="gap-2"
								>
									{entries.length < 2 ? (
										"Add at least 2 PDFs to merge"
									) : (
										<>
											<FileText className="h-4 w-4" />
											Merge {entries.length} PDFs
										</>
									)}
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
