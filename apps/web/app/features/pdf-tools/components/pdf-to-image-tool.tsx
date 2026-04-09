import { AlertCircle, Download, FileImage } from "lucide-react";
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
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import {
	type PdfPageImage,
	pdfToImages,
} from "~/features/pdf-tools/processors/pdf-to-image";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

type OutputFormat = "image/jpeg" | "image/png";
type Dpi = 72 | 150 | 300;

const DPI_OPTIONS: { value: Dpi; label: string }[] = [
	{ value: 72, label: "72 DPI (Screen)" },
	{ value: 150, label: "150 DPI (Default)" },
	{ value: 300, label: "300 DPI (Print)" },
];

function extensionForFormat(format: OutputFormat): string {
	return format === "image/jpeg" ? "jpg" : "png";
}

function pageFilename(
	pdfName: string,
	pageNum: number,
	totalPages: number,
	format: OutputFormat,
): string {
	const base = pdfName.replace(/\.pdf$/i, "");
	const ext = extensionForFormat(format);
	if (totalPages === 1) return `${base}.${ext}`;
	return `${base}-page-${pageNum}.${ext}`;
}

// ─── Results view: thumbnails + individual/bulk download ─────

function ResultsView({
	file,
	pages,
	outputFormat,
	onReset,
}: {
	file: File;
	pages: PdfPageImage[];
	outputFormat: OutputFormat;
	onReset: () => void;
}) {
	const [zipping, setZipping] = useState(false);

	const downloadAllAsZip = useCallback(async () => {
		setZipping(true);
		try {
			const { zipSync } = await import("fflate");
			const files: Record<string, Uint8Array> = {};
			for (const page of pages) {
				const name = pageFilename(
					file.name,
					page.pageNumber,
					pages.length,
					outputFormat,
				);
				files[name] = new Uint8Array(await page.blob.arrayBuffer());
			}
			const zipped = zipSync(files);
			const zipBlob = new Blob([zipped as BlobPart], {
				type: "application/zip",
			});
			const base = file.name.replace(/\.pdf$/i, "");
			const url = URL.createObjectURL(zipBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${base}-images.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} finally {
			setZipping(false);
		}
	}, [file.name, outputFormat, pages]);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium">
					{pages.length} {pages.length === 1 ? "page" : "pages"} converted
				</p>
				<p className="text-xs text-muted-foreground">
					{file.name} — {formatFileSize(file.size)}
				</p>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
				{pages.map((page) => {
					const url = URL.createObjectURL(page.blob);
					const fname = pageFilename(
						file.name,
						page.pageNumber,
						pages.length,
						outputFormat,
					);
					return (
						<div
							key={page.pageNumber}
							className="rounded-lg border bg-card overflow-hidden"
						>
							<div className="aspect-[3/4] bg-muted/30 flex items-center justify-center p-1">
								<img
									src={url}
									alt={`Page ${page.pageNumber}`}
									className="max-w-full max-h-full object-contain"
									onLoad={() => URL.revokeObjectURL(url)}
								/>
							</div>
							<div className="p-2 space-y-1">
								<p className="text-xs font-medium truncate">
									Page {page.pageNumber}
								</p>
								<p className="text-xs text-muted-foreground">
									{page.width}&times;{page.height} &middot;{" "}
									{formatFileSize(page.blob.size)}
								</p>
								<DownloadButton blob={page.blob} filename={fname} />
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex items-center gap-3 pt-2">
				{pages.length > 1 && (
					<Button
						onClick={downloadAllAsZip}
						className="gap-2"
						disabled={zipping}
					>
						{zipping ? (
							<Spinner className="size-4" />
						) : (
							<Download className="h-4 w-4" />
						)}
						Download all as ZIP
					</Button>
				)}
				<Button variant="outline" onClick={onReset}>
					Convert another
				</Button>
			</div>
		</div>
	);
}

// ─── Processing view: progress bar ──────────────────────────

function ProcessingView({
	file,
	outputFormat,
	dpi,
	quality,
	onDone,
	onError,
}: {
	file: File;
	outputFormat: OutputFormat;
	dpi: Dpi;
	quality: number;
	onDone: (pages: PdfPageImage[]) => void;
	onError: (message: string) => void;
}) {
	const [progress, setProgress] = useState({ page: 0, total: 0 });

	useEffect(() => {
		const controller = new AbortController();

		(async () => {
			try {
				const results = await pdfToImages(
					file,
					{
						outputFormat,
						dpi,
						quality: outputFormat === "image/jpeg" ? quality / 100 : undefined,
						signal: controller.signal,
					},
					(page, total) => setProgress({ page, total }),
				);
				if (controller.signal.aborted) return;
				onDone(results);
			} catch (err) {
				if (controller.signal.aborted) return;
				onError(err instanceof Error ? err.message : "Conversion failed");
			}
		})();

		return () => controller.abort();
	}, [file, outputFormat, dpi, quality, onDone, onError]);

	const pct =
		progress.total > 0
			? Math.round((progress.page / progress.total) * 100)
			: undefined;

	return (
		<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-4 px-8">
			<FileImage className="h-10 w-10 text-muted-foreground" />
			<ToolProgress
				value={pct}
				message={
					progress.total > 0
						? `Converting page ${progress.page} of ${progress.total}...`
						: "Loading PDF..."
				}
			/>
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────

export default function PdfToImageTool({
	defaultOutputFormat,
}: {
	defaultOutputFormat: OutputFormat;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [outputFormat] = useState<OutputFormat>(defaultOutputFormat);
	const [dpi, setDpi] = useState<Dpi>(150);
	const [quality, setQuality] = useState(92);

	const [status, setStatus] = useState<
		"idle" | "processing" | "done" | "error"
	>("idle");
	const [pages, setPages] = useState<PdfPageImage[]>([]);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setStatus("processing");
			setPages([]);
			setError(null);
		}
	}, []);

	const handleDone = useCallback((results: PdfPageImage[]) => {
		setPages(results);
		setStatus("done");
	}, []);

	const handleError = useCallback((message: string) => {
		setError(message);
		setStatus("error");
	}, []);

	const reprocessIfDone = useCallback(() => {
		if (status === "done" && file) {
			setStatus("processing");
			setPages([]);
		}
	}, [status, file]);

	const reset = useCallback(() => {
		setFile(null);
		setStatus("idle");
		setPages([]);
		setError(null);
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-6">
				<div className="space-y-2">
					<span className="text-sm font-medium">Resolution</span>
					<Select
						value={String(dpi)}
						onValueChange={(v) => {
							setDpi(Number(v) as Dpi);
							reprocessIfDone();
						}}
					>
						<SelectTrigger className="w-[200px]" aria-label="Resolution">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{DPI_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={String(opt.value)}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{outputFormat === "image/jpeg" && (
					<div className="space-y-2 flex-1 min-w-[200px]">
						<span className="text-sm font-medium">JPG Quality: {quality}%</span>
						<Slider
							aria-label="JPG quality"
							value={[quality]}
							onValueChange={(v) => {
								setQuality(v[0]);
								reprocessIfDone();
							}}
							min={10}
							max={100}
							step={1}
							className="max-w-sm"
						/>
					</div>
				)}
			</div>

			<div className="min-h-[460px]">
				{status === "idle" && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_PDF} onFiles={handleFiles} />
					</div>
				)}

				{status === "processing" && file && (
					<ProcessingView
						file={file}
						outputFormat={outputFormat}
						dpi={dpi}
						quality={quality}
						onDone={handleDone}
						onError={handleError}
					/>
				)}

				{status === "error" && (
					<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-3">
						<AlertCircle className="h-8 w-8 text-destructive" />
						<p className="text-sm text-destructive max-w-md text-center">
							{error}
						</p>
						<Button variant="outline" onClick={reset}>
							Try another file
						</Button>
					</div>
				)}

				{status === "done" && file && pages.length > 0 && (
					<ResultsView
						file={file}
						pages={pages}
						outputFormat={outputFormat}
						onReset={reset}
					/>
				)}
			</div>
		</div>
	);
}
