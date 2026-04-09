import { AlertCircle, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
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
	type CompressionLevel,
	type CompressPdfResult,
	compressPdf,
} from "~/features/pdf-tools/processors/compress-pdf";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

const LEVEL_OPTIONS: { value: CompressionLevel; label: string }[] = [
	{ value: "low", label: "Low (high quality)" },
	{ value: "medium", label: "Medium (balanced)" },
	{ value: "high", label: "High (smaller file)" },
];

function compressionFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-compressed.pdf`;
}

export default function PdfCompressTool() {
	const [file, setFile] = useState<File | null>(null);
	const [level, setLevel] = useState<CompressionLevel>("medium");

	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState({ page: 0, total: 0 });
	const [result, setResult] = useState<CompressPdfResult | null>(null);
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
		setProgress({ page: 0, total: 0 });
	}, []);

	// Auto-process when file or level changes
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);
		setProgress({ page: 0, total: 0 });

		(async () => {
			try {
				const res = await compressPdf(
					file,
					{ level, signal: controller.signal },
					(page, total) => setProgress({ page, total }),
				);
				if (controller.signal.aborted) return;
				setResult(res);
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Compression failed");
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file, level]);

	const pct =
		progress.total > 0
			? Math.round((progress.page / progress.total) * 100)
			: undefined;

	const resultIsLarger = result && result.compressedSize >= result.originalSize;

	return (
		<div className="space-y-6">
			{/* Compression level selector */}
			<div className="space-y-2">
				<span className="text-sm font-medium">Compression Level</span>
				<Select
					value={level}
					onValueChange={(v) => setLevel(v as CompressionLevel)}
				>
					<SelectTrigger className="w-[240px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LEVEL_OPTIONS.map((opt) => (
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
									Compressing
									{progress.total > 0
										? ` page ${progress.page} of ${progress.total}...`
										: "..."}
								</span>
								{/* Result status — cross-fade */}
								{result && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
										style={{ opacity: processing ? 0 : 1 }}
									>
										{result.compressedSize < result.originalSize
											? `${formatFileSize(result.compressedSize)} — ${Math.round((1 - result.compressedSize / result.originalSize) * 100)}% smaller`
											: "Could not reduce"}
									</span>
								)}
							</div>
						</div>

						{/* Processing state */}
						{processing && !result && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[300px] gap-4 px-8">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<ToolProgress
									value={pct}
									message={
										progress.total > 0
											? `Compressing page ${progress.page} of ${progress.total}...`
											: "Loading PDF..."
									}
								/>
							</div>
						)}

						{/* Re-processing overlay: dim previous result */}
						{processing && result && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[200px] gap-3 opacity-50 transition-opacity duration-300">
								<Spinner className="size-8" />
								<p className="text-sm text-muted-foreground">
									Re-compressing with new settings...
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

						{/* Done state: show size comparison */}
						{!processing && result && !resultIsLarger && (
							<div className="rounded-lg border bg-card p-4 space-y-3">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">Original</p>
										<p className="font-medium">
											{formatFileSize(result.originalSize)}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Compressed</p>
										<p className="font-medium">
											{formatFileSize(result.compressedSize)}
										</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{result.pageCount} {result.pageCount === 1 ? "page" : "pages"}{" "}
									processed
								</p>
							</div>
						)}

						{!processing && resultIsLarger && (
							<div className="rounded-lg border border-amber-600/30 bg-amber-600/5 p-4">
								<p className="text-sm text-amber-600 dark:text-amber-400">
									This PDF couldn't be compressed further. Text-heavy or
									already-optimized PDFs may not benefit from image-based
									compression.
								</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							{!processing && result && !resultIsLarger && (
								<DownloadButton
									blob={result.blob}
									filename={compressionFilename(file.name)}
								/>
							)}
							<Button variant="outline" onClick={reset}>
								{result || error ? "Compress another" : "Cancel"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
