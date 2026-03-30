import { AlertCircle, FileText, Lock } from "lucide-react";
import { useCallback, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import {
	type UnlockPdfResult,
	unlockPdf,
} from "~/features/pdf-tools/processors/unlock-pdf";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

function unlockedFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-unlocked.pdf`;
}

export default function PdfUnlockTool() {
	const [file, setFile] = useState<File | null>(null);
	const [password, setPassword] = useState("");

	const [processing, setProcessing] = useState(false);
	const [result, setResult] = useState<UnlockPdfResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length > 0) {
			setFile(incoming[0]);
			setResult(null);
			setError(null);
			setPassword("");
		}
	}, []);

	const reset = useCallback(() => {
		setFile(null);
		setResult(null);
		setError(null);
		setProcessing(false);
		setPassword("");
	}, []);

	const handleUnlock = useCallback(async () => {
		if (!file) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		try {
			const res = await unlockPdf(file, {
				password: password || undefined,
				signal: controller.signal,
			});
			if (controller.signal.aborted) return;
			setResult(res);
			setProcessing(false);
		} catch (err) {
			if (controller.signal.aborted) return;
			setError(err instanceof Error ? err.message : "Failed to unlock PDF");
			setProcessing(false);
		}
	}, [file, password]);

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{/* Idle: show dropzone */}
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_PDF} onFiles={handleFiles} />
					</div>
				)}

				{/* File selected: show password input and result area */}
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
									</p>
								</div>
							</div>
						</div>

						{/* Password input */}
						{!result && (
							<div className="space-y-3">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<Lock className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">PDF Password</span>
									</div>
									<Input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Enter the PDF password"
										disabled={processing}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !processing) {
												handleUnlock();
											}
										}}
									/>
									<p className="text-xs text-muted-foreground">
										You must know the password to unlock this PDF. If the PDF
										only has printing or copying restrictions, leave the
										password empty.
									</p>
								</div>

								<Button
									onClick={handleUnlock}
									disabled={processing}
									className="w-full sm:w-auto"
								>
									{processing ? (
										<>
											<Spinner className="size-4 mr-2" />
											Unlocking...
										</>
									) : (
										"Unlock PDF"
									)}
								</Button>
							</div>
						)}

						{/* Result label — visible once processing starts */}
						{(processing || result) && (
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium">Result</h3>
								<div className="relative">
									<span
										className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
										style={{
											opacity: processing ? 1 : 0,
										}}
									>
										<Spinner className="size-3" />
										Removing protection...
									</span>
									{result && (
										<span
											className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
											style={{
												opacity: processing ? 0 : 1,
											}}
										>
											{formatFileSize(result.unlockedSize)} — {result.pageCount}{" "}
											{result.pageCount === 1 ? "page" : "pages"}
										</span>
									)}
								</div>
							</div>
						)}

						{/* Processing state */}
						{processing && !result && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[300px] gap-4 px-8">
								<FileText className="h-10 w-10 text-muted-foreground" />
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Spinner className="size-4" />
									Removing password protection...
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
										<p className="text-muted-foreground">Unlocked</p>
										<p className="font-medium">
											{formatFileSize(result.unlockedSize)}
										</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									{result.pageCount} {result.pageCount === 1 ? "page" : "pages"}{" "}
									— password protection removed
								</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							{!processing && result && (
								<DownloadButton
									blob={result.blob}
									filename={unlockedFilename(file.name)}
								/>
							)}
							<Button variant="outline" onClick={reset}>
								{result || error ? "Unlock another" : "Cancel"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
