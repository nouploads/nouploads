import { AlertCircle, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import {
	type PageNumbersPdfResult,
	pageNumbersPdf,
} from "~/features/pdf-tools/processors/page-numbers-pdf";
import { renderPdfPagePreview } from "~/features/pdf-tools/processors/pdf-to-image";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

type Position =
	| "top-left"
	| "top-center"
	| "top-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

type NumberFormat =
	| "number"
	| "page-n"
	| "n-of-total"
	| "page-n-of-total"
	| "roman";

const POSITION_LABELS: Record<Position, string> = {
	"top-left": "Top Left",
	"top-center": "Top Center",
	"top-right": "Top Right",
	"bottom-left": "Bottom Left",
	"bottom-center": "Bottom Center",
	"bottom-right": "Bottom Right",
};

const FORMAT_LABELS: Record<NumberFormat, string> = {
	number: "1, 2, 3",
	"page-n": "Page 1, Page 2",
	"n-of-total": "1 of N, 2 of N",
	"page-n-of-total": "Page 1 of N",
	roman: "i, ii, iii",
};

function numberedFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-numbered.pdf`;
}

export default function PdfPageNumbersTool() {
	const [file, setFile] = useState<File | null>(null);
	const [position, setPosition] = useState<Position>("bottom-center");
	const [format, setFormat] = useState<NumberFormat>("number");
	const [fontSize, setFontSize] = useState(12);
	const [startNumber, setStartNumber] = useState(1);
	const [margin, setMargin] = useState(40);
	const [skipFirst, setSkipFirst] = useState(false);

	const [processing, setProcessing] = useState(false);
	const [result, setResult] = useState<PageNumbersPdfResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setResult(null);
			setError(null);
			setPreviewUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
		}
	}, []);

	const reset = useCallback(() => {
		setFile(null);
		setResult(null);
		setError(null);
		setProcessing(false);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
	}, []);

	// Auto-process when file or settings change
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const res = await pageNumbersPdf(file, {
					position,
					format,
					fontSize,
					startNumber,
					margin,
					skipFirst,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setResult(res);
				setProcessing(false);

				// Render first page preview from the numbered PDF
				try {
					const url = await renderPdfPagePreview(
						res.blob,
						1,
						controller.signal,
					);
					if (controller.signal.aborted) {
						URL.revokeObjectURL(url);
						return;
					}
					setPreviewUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev);
						return url;
					});
				} catch {
					// Preview is optional
				}
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Adding page numbers failed",
				);
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file, position, format, fontSize, startNumber, margin, skipFirst]);

	// Cleanup preview URL on unmount
	useEffect(() => {
		return () => {
			setPreviewUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
		};
	}, []);

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="space-y-4">
				{/* Position grid */}
				<div className="space-y-2">
					<span className="text-sm font-medium">Position</span>
					<div className="grid grid-cols-3 gap-1.5 max-w-xs">
						{(Object.keys(POSITION_LABELS) as Position[]).map((pos) => (
							<button
								key={pos}
								type="button"
								onClick={() => setPosition(pos)}
								className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
									position === pos
										? "border-primary bg-primary text-primary-foreground"
										: "border-input bg-card hover:bg-accent hover:text-accent-foreground"
								}`}
							>
								{POSITION_LABELS[pos]}
							</button>
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{/* Format selector */}
					<div className="space-y-2">
						<span className="text-sm font-medium">Format</span>
						<Select
							value={format}
							onValueChange={(v) => setFormat(v as NumberFormat)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(FORMAT_LABELS) as NumberFormat[]).map((f) => (
									<SelectItem key={f} value={f}>
										{FORMAT_LABELS[f]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Font size slider */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Font Size</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{fontSize}pt
							</span>
						</div>
						<Slider
							value={[fontSize]}
							onValueChange={([v]) => setFontSize(v)}
							min={8}
							max={24}
							step={1}
						/>
					</div>

					{/* Margin slider */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Margin</span>
							<span className="text-xs text-muted-foreground tabular-nums">
								{margin}pt
							</span>
						</div>
						<Slider
							value={[margin]}
							onValueChange={([v]) => setMargin(v)}
							min={20}
							max={100}
							step={1}
						/>
					</div>

					{/* Start number input */}
					<div className="space-y-2">
						<span className="text-sm font-medium">Start Number</span>
						<Input
							type="number"
							value={startNumber}
							onChange={(e) => {
								const v = Number.parseInt(e.target.value, 10);
								if (!Number.isNaN(v) && v >= 1 && v <= 9999) {
									setStartNumber(v);
								}
							}}
							min={1}
							max={9999}
							className="w-[120px]"
						/>
					</div>
				</div>

				{/* Skip first page toggle */}
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={skipFirst}
						onChange={(e) => setSkipFirst(e.target.checked)}
						className="size-4 rounded border-input accent-primary"
					/>
					<span className="text-sm">Skip first page (title page)</span>
				</label>
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

						{/* Result label */}
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Result</h3>
							<div className="relative">
								<span
									className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
									style={{ opacity: processing ? 1 : 0 }}
								>
									<Spinner className="size-3" />
									Adding page numbers...
								</span>
								{result && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
										style={{ opacity: processing ? 0 : 1 }}
									>
										{formatFileSize(result.numberedSize)} — {result.pageCount}{" "}
										{result.pageCount === 1 ? "page" : "pages"} numbered
									</span>
								)}
							</div>
						</div>

						{/* Processing state (first load) */}
						{processing && !result && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[300px] gap-4 px-8">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									Adding page numbers to PDF...
								</div>
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

						{/* Page preview */}
						{(previewUrl || (processing && result)) && (
							<div className="relative rounded-lg border bg-muted/30 overflow-hidden">
								{previewUrl && (
									<div
										className="transition-opacity duration-300"
										style={{ opacity: processing ? 0.25 : 1 }}
									>
										<img
											src={previewUrl}
											alt="Page 1 preview"
											className="w-full h-auto"
										/>
									</div>
								)}
								{processing && result && (
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300">
										<Spinner className="size-10" />
									</div>
								)}
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
										<p className="text-muted-foreground">With Numbers</p>
										<p className="font-medium">
											{formatFileSize(result.numberedSize)}
										</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{result.pageCount}{" "}
									{result.pageCount === 1 ? "page" : "pages"} numbered (
									{POSITION_LABELS[position]}, {FORMAT_LABELS[format]})
								</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							{!processing && result && (
								<DownloadButton
									blob={result.blob}
									filename={numberedFilename(file.name)}
								/>
							)}
							<Button variant="outline" onClick={reset}>
								{result || error ? "Number another" : "Cancel"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
