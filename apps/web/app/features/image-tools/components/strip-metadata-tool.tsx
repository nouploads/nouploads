import {
	AlertTriangle,
	Camera,
	CheckCircle2,
	Download,
	MapPin,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import type {
	MetadataSummary,
	StripResult,
} from "~/features/image-tools/processors/strip-metadata";
import { formatFileSize } from "~/lib/utils";

const ACCEPT_STRIP: Record<string, string[]> = {
	"image/png": [".png"],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/webp": [".webp"],
};

interface FileState {
	file: File;
	processing: boolean;
	result?: StripResult;
	error?: string;
}

function generateOutputFilename(name: string): string {
	const base = name.replace(/\.[^.]+$/, "");
	const ext = name.match(/\.[^.]+$/)?.[0] ?? ".png";
	return `${base}-clean${ext}`;
}

function MetadataBadge({ summary }: { summary: MetadataSummary }) {
	return (
		<div className="space-y-1.5 text-xs">
			{summary.camera && (
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<Camera className="size-3 shrink-0" />
					<span className="truncate">{summary.camera}</span>
				</div>
			)}
			{summary.hasGps && summary.gps && (
				<div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
					<MapPin className="size-3 shrink-0" />
					<span>
						GPS: {summary.gps.lat.toFixed(4)}, {summary.gps.lng.toFixed(4)}
					</span>
				</div>
			)}
			{summary.date && (
				<div className="text-muted-foreground truncate">{summary.date}</div>
			)}
			{summary.software && (
				<div className="text-muted-foreground truncate">{summary.software}</div>
			)}
			<div className="text-muted-foreground">
				{summary.fieldCount} metadata field
				{summary.fieldCount !== 1 ? "s" : ""}
				{summary.dimensions.width > 0 &&
					` · ${summary.dimensions.width}×${summary.dimensions.height}`}
			</div>
		</div>
	);
}

function FileCard({ state }: { state: FileState }) {
	const { file, processing, result, error } = state;
	const savings = result
		? result.originalSize - result.strippedSize
		: undefined;
	const savingsPercent =
		savings !== undefined && result
			? Math.round((savings / result.originalSize) * 100)
			: undefined;

	return (
		<div className="rounded-lg border bg-card p-4 space-y-3">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-medium truncate min-w-0">{file.name}</p>
				<span className="text-xs text-muted-foreground whitespace-nowrap">
					{formatFileSize(file.size)}
				</span>
			</div>

			{processing && (
				<div className="flex items-center gap-2">
					<Spinner className="size-4" />
					<span className="text-xs text-muted-foreground">
						Stripping metadata...
					</span>
				</div>
			)}

			{error && (
				<div className="rounded border border-destructive/50 bg-destructive/5 p-2">
					<p className="text-xs text-destructive">{error}</p>
				</div>
			)}

			{result && (
				<>
					{/* Before metadata */}
					{result.metadataBefore.fieldCount > 0 && (
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
								Removed
							</p>
							<MetadataBadge summary={result.metadataBefore} />
						</div>
					)}

					{/* After: clean state */}
					<div className="flex items-center gap-2">
						<CheckCircle2 className="size-4 text-green-600 dark:text-green-400 shrink-0" />
						<span className="text-sm font-medium text-green-700 dark:text-green-300">
							Clean
						</span>
						<span className="text-xs text-muted-foreground ml-auto">
							{formatFileSize(result.strippedSize)}
							{savingsPercent !== undefined && savings !== undefined && (
								<>
									{" "}
									({savings >= 0 ? "-" : "+"}
									{Math.abs(savingsPercent)}%)
								</>
							)}
						</span>
					</div>

					{/* GPS stripped warning highlight */}
					{result.metadataBefore.hasGps && (
						<div className="flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-2 py-1.5">
							<AlertTriangle className="size-3 text-amber-600 shrink-0" />
							<span className="text-xs text-amber-700 dark:text-amber-400">
								GPS location data was removed
							</span>
						</div>
					)}

					<DownloadButton
						blob={result.blob}
						filename={generateOutputFilename(file.name)}
					/>
				</>
			)}
		</div>
	);
}

export default function StripMetadataTool() {
	const [files, setFiles] = useState<FileState[]>([]);

	const handleFiles = useCallback((incoming: File[]) => {
		const newStates: FileState[] = incoming.map((f) => ({
			file: f,
			processing: true,
		}));
		setFiles((prev) => [...prev, ...newStates]);
	}, []);

	// Process files as they arrive
	useEffect(() => {
		const controller = new AbortController();
		const unprocessed = files.filter(
			(f) => f.processing && !f.result && !f.error,
		);
		if (unprocessed.length === 0) return;

		(async () => {
			const { stripMetadata } = await import(
				"~/features/image-tools/processors/strip-metadata"
			);

			for (const state of unprocessed) {
				if (controller.signal.aborted) return;

				try {
					const result = await stripMetadata(state.file, {
						signal: controller.signal,
					});
					if (controller.signal.aborted) return;

					setFiles((prev) =>
						prev.map((f) =>
							f.file === state.file ? { ...f, processing: false, result } : f,
						),
					);
				} catch (err) {
					if (controller.signal.aborted) return;
					setFiles((prev) =>
						prev.map((f) =>
							f.file === state.file
								? {
										...f,
										processing: false,
										error:
											err instanceof Error
												? err.message
												: "Failed to strip metadata",
									}
								: f,
						),
					);
				}
			}
		})();

		return () => controller.abort();
	}, [files]);

	const handleDownloadAll = useCallback(async () => {
		const completed = files.filter((f) => f.result);
		if (completed.length < 2) return;

		const JSZip = (await import("jszip")).default;
		const zip = new JSZip();

		for (const state of completed) {
			if (!state.result) continue;
			const name = generateOutputFilename(state.file.name);
			zip.file(name, state.result.blob);
		}

		const blob = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "stripped-images.zip";
		a.click();
		URL.revokeObjectURL(url);
	}, [files]);

	const reset = useCallback(() => {
		setFiles([]);
	}, []);

	const completedCount = files.filter((f) => f.result).length;
	const processingCount = files.filter((f) => f.processing).length;

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{files.length === 0 && (
					<div className="h-[460px]">
						<ToolDropzone
							accept={ACCEPT_STRIP}
							onFiles={handleFiles}
							multiple
						/>
					</div>
				)}

				{files.length > 0 && (
					<div className="space-y-4">
						{/* Summary bar */}
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								{completedCount} of {files.length} processed
								{processingCount > 0 && (
									<>
										{" "}
										· <Spinner className="size-3 inline" /> {processingCount}{" "}
										processing
									</>
								)}
							</p>
							<div className="flex items-center gap-2">
								{completedCount >= 2 && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleDownloadAll}
										className="gap-1.5"
									>
										<Download className="size-3.5" />
										Download All as ZIP
									</Button>
								)}
								<Button variant="outline" size="sm" onClick={reset}>
									Clear all
								</Button>
							</div>
						</div>

						{/* File cards */}
						<div className="grid gap-3">
							{files.map((state, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: file list order is stable
								<FileCard key={i} state={state} />
							))}
						</div>

						{/* Add more files */}
						<div className="h-32">
							<ToolDropzone
								accept={ACCEPT_STRIP}
								onFiles={handleFiles}
								multiple
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
