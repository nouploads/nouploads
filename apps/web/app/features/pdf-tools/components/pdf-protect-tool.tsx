import { AlertCircle, Eye, EyeOff, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import {
	type ProtectPdfResult,
	protectPdf,
} from "~/features/pdf-tools/processors/protect-pdf";
import { ACCEPT_PDF } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

function protectedFilename(originalName: string): string {
	const base = originalName.replace(/\.pdf$/i, "");
	return `${base}-protected.pdf`;
}

export default function PdfProtectTool() {
	const [file, setFile] = useState<File | null>(null);
	const [userPassword, setUserPassword] = useState("");
	const [ownerPassword, setOwnerPassword] = useState("");
	const [showUserPw, setShowUserPw] = useState(false);
	const [showOwnerPw, setShowOwnerPw] = useState(false);
	const [allowPrinting, setAllowPrinting] = useState(true);
	const [allowCopying, setAllowCopying] = useState(true);
	const [allowEditing, setAllowEditing] = useState(true);

	const [processing, setProcessing] = useState(false);
	const [result, setResult] = useState<ProtectPdfResult | null>(null);
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
	}, []);

	const hasPassword = userPassword.length > 0 || ownerPassword.length > 0;

	// Auto-process when file and passwords change
	useEffect(() => {
		if (!file) return;
		if (!hasPassword) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const res = await protectPdf(file, {
					userPassword,
					ownerPassword,
					allowPrinting,
					allowCopying,
					allowEditing,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setResult(res);
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Protection failed");
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [
		file,
		userPassword,
		ownerPassword,
		allowPrinting,
		allowCopying,
		allowEditing,
		hasPassword,
	]);

	return (
		<div className="space-y-6">
			{/* Password inputs */}
			<div className="space-y-4">
				<div className="space-y-2">
					<span className="text-sm font-medium">
						User Password (required to open)
					</span>
					<div className="relative">
						<Input
							type={showUserPw ? "text" : "password"}
							value={userPassword}
							onChange={(e) => setUserPassword(e.target.value)}
							placeholder="Enter password to open the PDF"
							maxLength={128}
							className="pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowUserPw(!showUserPw)}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={showUserPw ? "Hide password" : "Show password"}
						>
							{showUserPw ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>

				<div className="space-y-2">
					<span className="text-sm font-medium">
						Owner Password (required to change permissions)
					</span>
					<div className="relative">
						<Input
							type={showOwnerPw ? "text" : "password"}
							value={ownerPassword}
							onChange={(e) => setOwnerPassword(e.target.value)}
							placeholder="Leave blank to use user password"
							maxLength={128}
							className="pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowOwnerPw(!showOwnerPw)}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label={showOwnerPw ? "Hide password" : "Show password"}
						>
							{showOwnerPw ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>

				{/* Permission checkboxes */}
				<div className="space-y-2">
					<span className="text-sm font-medium">Permissions</span>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={allowPrinting}
								onChange={(e) => setAllowPrinting(e.target.checked)}
								className="h-4 w-4 rounded border-input accent-primary"
							/>
							<span className="text-sm">Allow printing</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={allowCopying}
								onChange={(e) => setAllowCopying(e.target.checked)}
								className="h-4 w-4 rounded border-input accent-primary"
							/>
							<span className="text-sm">Allow copying</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={allowEditing}
								onChange={(e) => setAllowEditing(e.target.checked)}
								className="h-4 w-4 rounded border-input accent-primary"
							/>
							<span className="text-sm">Allow editing</span>
						</label>
					</div>
				</div>
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

						{/* Hint when no password entered */}
						{!hasPassword && (
							<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[200px] gap-3">
								<FileText className="h-8 w-8 text-muted-foreground" />
								<p className="text-sm text-muted-foreground">
									Enter at least one password to protect the PDF
								</p>
							</div>
						)}

						{/* Result label -- visible once file + password are set */}
						{hasPassword && (
							<>
								<div className="flex items-center justify-between">
									<h3 className="text-sm font-medium">Result</h3>
									<div className="relative">
										{/* Processing status */}
										<span
											className="text-xs text-muted-foreground transition-opacity duration-300 flex items-center gap-1.5"
											style={{
												opacity: processing ? 1 : 0,
											}}
										>
											<Spinner className="size-3" />
											Protecting PDF...
										</span>
										{/* Result status */}
										{result && (
											<span
												className="absolute right-0 top-0 whitespace-nowrap text-xs text-muted-foreground transition-opacity duration-300"
												style={{
													opacity: processing ? 0 : 1,
												}}
											>
												{formatFileSize(result.protectedSize)} —{" "}
												{result.pageCount}{" "}
												{result.pageCount === 1 ? "page" : "pages"} protected
											</span>
										)}
									</div>
								</div>

								{/* Processing state */}
								{processing && !result && (
									<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[300px] gap-4 px-8">
										<FileText className="h-10 w-10 text-muted-foreground" />
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Spinner className="size-4" />
											Applying password protection...
										</div>
									</div>
								)}

								{/* Re-processing overlay */}
								{processing && result && (
									<div className="rounded-lg border bg-muted/30 overflow-hidden flex flex-col items-center justify-center h-[200px] gap-3 opacity-50 transition-opacity duration-300">
										<Spinner className="size-8" />
										<p className="text-sm text-muted-foreground">
											Re-processing with new settings...
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
												<p className="text-muted-foreground">Protected</p>
												<p className="font-medium">
													{formatFileSize(result.protectedSize)}
												</p>
											</div>
										</div>
										<div className="text-xs text-muted-foreground space-y-0.5">
											<p>
												{result.pageCount}{" "}
												{result.pageCount === 1 ? "page" : "pages"} protected
											</p>
											<p>
												Printing: {allowPrinting ? "allowed" : "restricted"}
												{" / "}
												Copying: {allowCopying ? "allowed" : "restricted"}
												{" / "}
												Editing: {allowEditing ? "allowed" : "restricted"}
											</p>
										</div>
									</div>
								)}
							</>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							{!processing && result && (
								<DownloadButton
									blob={result.blob}
									filename={protectedFilename(file.name)}
								/>
							)}
							<Button variant="outline" onClick={reset}>
								{result || error ? "Protect another" : "Cancel"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
