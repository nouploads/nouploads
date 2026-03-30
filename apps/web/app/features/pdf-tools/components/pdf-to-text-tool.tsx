import {
	AlertCircle,
	Check,
	ClipboardCopy,
	Download,
	FileText,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import {
	type PdfToTextResult,
	pdfToText,
} from "~/features/pdf-tools/processors/pdf-to-text";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

// ─── Results view: textarea + copy/download ────────────────

function ResultsView({
	file,
	result,
	onReset,
}: {
	file: File;
	result: PdfToTextResult;
	onReset: () => void;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(result.text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = result.text;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [result.text]);

	const handleDownload = useCallback(() => {
		const blob = new Blob([result.text], { type: "text/plain" });
		const base = file.name.replace(/\.pdf$/i, "");
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${base}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [file.name, result.text]);

	const hasText = result.charCount > 0;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium">
					{result.pageCount} {result.pageCount === 1 ? "page" : "pages"}{" "}
					&middot; {result.charCount.toLocaleString()} characters
				</p>
				<p className="text-xs text-muted-foreground">
					{file.name} — {formatFileSize(file.size)}
				</p>
			</div>

			{hasText ? (
				<textarea
					readOnly
					value={result.text}
					className="w-full h-[400px] rounded-lg border bg-muted/30 p-4 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
					aria-label="Extracted text content"
				/>
			) : (
				<div className="rounded-lg border bg-muted/30 flex flex-col items-center justify-center h-[400px] gap-3">
					<FileText className="h-8 w-8 text-muted-foreground" />
					<p className="text-sm text-muted-foreground max-w-md text-center">
						No extractable text found. This PDF may contain only images or
						scanned pages. Use an OCR tool to extract text from scanned
						documents.
					</p>
				</div>
			)}

			<div className="flex items-center gap-3 pt-2">
				{hasText && (
					<>
						<Button onClick={handleCopy} variant="outline" className="gap-2">
							{copied ? (
								<Check className="h-4 w-4" />
							) : (
								<ClipboardCopy className="h-4 w-4" />
							)}
							{copied ? "Copied!" : "Copy to clipboard"}
						</Button>
						<Button onClick={handleDownload} className="gap-2">
							<Download className="h-4 w-4" />
							Download as .txt
						</Button>
					</>
				)}
				<Button variant="outline" onClick={onReset}>
					Extract another
				</Button>
			</div>
		</div>
	);
}

// ─── Processing view: progress bar ──────────────────────────

function ProcessingView({
	file,
	onDone,
	onError,
}: {
	file: File;
	onDone: (result: PdfToTextResult) => void;
	onError: (message: string) => void;
}) {
	const [progress, setProgress] = useState({ page: 0, total: 0 });

	useEffect(() => {
		const controller = new AbortController();

		(async () => {
			try {
				const result = await pdfToText(
					file,
					{ signal: controller.signal },
					(page, total) => setProgress({ page, total }),
				);
				if (controller.signal.aborted) return;
				onDone(result);
			} catch (err) {
				if (controller.signal.aborted) return;
				onError(err instanceof Error ? err.message : "Text extraction failed");
			}
		})();

		return () => controller.abort();
	}, [file, onDone, onError]);

	const pct =
		progress.total > 0
			? Math.round((progress.page / progress.total) * 100)
			: undefined;

	return (
		<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[400px] gap-4 px-8">
			<FileText className="h-10 w-10 text-muted-foreground" />
			<ToolProgress
				value={pct}
				message={
					progress.total > 0
						? `Extracting text from page ${progress.page} of ${progress.total}...`
						: "Loading PDF..."
				}
			/>
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────

export default function PdfToTextTool() {
	const [file, setFile] = useState<File | null>(null);
	const [status, setStatus] = useState<
		"idle" | "processing" | "done" | "error"
	>("idle");
	const [result, setResult] = useState<PdfToTextResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setStatus("processing");
			setResult(null);
			setError(null);
		}
	}, []);

	const handleDone = useCallback((res: PdfToTextResult) => {
		setResult(res);
		setStatus("done");
	}, []);

	const handleError = useCallback((message: string) => {
		setError(message);
		setStatus("error");
	}, []);

	const reset = useCallback(() => {
		setFile(null);
		setStatus("idle");
		setResult(null);
		setError(null);
	}, []);

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{status === "idle" && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_PDF} onFiles={handleFiles} />
					</div>
				)}

				{status === "processing" && file && (
					<ProcessingView
						file={file}
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

				{status === "done" && file && result && (
					<ResultsView file={file} result={result} onReset={reset} />
				)}
			</div>
		</div>
	);
}
