import { AlertCircle, Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import {
	DEFAULT_SIZES,
	type FaviconGeneratorResult,
	generateFavicon,
} from "../processors/favicon-generator";

function toIcoFilename(name: string): string {
	return name.replace(/\.[^.]+$/, ".ico");
}

export default function FaviconGeneratorTool() {
	const [file, setFile] = useState<File | null>(null);
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [result, setResult] = useState<FaviconGeneratorResult | null>(null);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasResult = result !== null;

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFile(incoming[0]);
		setResult(null);
		setError(null);
	}, []);

	// Create original preview URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Process favicon generation
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const faviconResult = await generateFavicon(file, {
					sizes: DEFAULT_SIZES,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;
				setResult(faviconResult);
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Favicon generation failed",
				);
				setResult(null);
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file]);

	const reset = useCallback(() => {
		setFile(null);
		setOriginalUrl(null);
		setResult(null);
		setError(null);
	}, []);

	// Create stable preview URLs for size previews, revoke on result change
	const previewUrls = useMemo(() => {
		if (!result) return [];
		return result.sizes.map(({ pngBlob }) => URL.createObjectURL(pngBlob));
	}, [result]);

	useEffect(() => {
		return () => {
			for (const url of previewUrls) URL.revokeObjectURL(url);
		};
	}, [previewUrls]);

	const downloadPng = useCallback((blob: Blob, size: number) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `favicon-${size}x${size}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, []);

	const outputFilename = file ? toIcoFilename(file.name) : "favicon.ico";

	return (
		<div className="space-y-6">
			{!file && (
				<div className="h-[460px]">
					<ToolDropzone
						accept={ACCEPT_IMAGES}
						onFiles={handleFiles}
						multiple={false}
						maxSizeMB={50}
					/>
				</div>
			)}

			{file && (
				<>
					{/* Result label */}
					<div className="flex justify-between">
						<div>
							<p className="text-sm font-medium">Source Image</p>
							<p className="text-xs text-muted-foreground">
								{file.name} — {formatFileSize(file.size)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm font-medium">Result</p>
							<p className="text-xs text-muted-foreground relative">
								<span
									className="inline-flex items-center gap-1.5 transition-opacity duration-300"
									style={{ opacity: processing ? 1 : 0 }}
								>
									<Spinner className="size-3 inline" /> Generating...
								</span>
								{result && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
										style={{ opacity: processing ? 0 : 1 }}
									>
										favicon.ico — {formatFileSize(result.icoBlob.size)}
									</span>
								)}
							</p>
						</div>
					</div>

					{/* Preview area */}
					{processing && !hasResult ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[300px]">
							{originalUrl ? (
								<div className="relative h-full w-full">
									<img
										src={originalUrl}
										alt="Source"
										className="h-full w-full object-contain opacity-60"
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50">
										<Spinner className="size-6" />
										<p className="text-sm text-muted-foreground">
											Generating favicon sizes...
										</p>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center gap-2 p-4">
									<Spinner className="size-6" />
									<p className="text-sm text-muted-foreground">
										Loading preview...
									</p>
								</div>
							)}
						</div>
					) : error ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[300px]">
							<div className="flex flex-col items-center gap-2 p-4 text-center">
								<AlertCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						</div>
					) : result ? (
						<div className="rounded-lg border bg-muted/30 p-6">
							<div className="flex flex-wrap items-end justify-center gap-8">
								{result.sizes.map(({ size, pngBlob }, i) => (
									<div key={size} className="flex flex-col items-center gap-2">
										<div
											className="border rounded bg-white dark:bg-gray-900 flex items-center justify-center"
											style={{
												width: Math.max(size * 2, 64),
												height: Math.max(size * 2, 64),
											}}
										>
											<img
												src={previewUrls[i]}
												alt={`${size}x${size} favicon`}
												width={size}
												height={size}
												className="pixelated"
												style={{
													imageRendering: "pixelated",
													width: size,
													height: size,
												}}
											/>
										</div>
										<p className="text-xs text-muted-foreground font-medium">
											{size}x{size}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatFileSize(pngBlob.size)}
										</p>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 text-xs"
											onClick={() => downloadPng(pngBlob, size)}
										>
											<Download className="h-3 w-3 mr-1" />
											PNG
										</Button>
									</div>
								))}
							</div>
						</div>
					) : originalUrl ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[300px]">
							<img
								src={originalUrl}
								alt="Source"
								className="max-w-full max-h-full object-contain"
							/>
						</div>
					) : null}

					{/* Actions */}
					<div className="flex items-center gap-3 h-9">
						{result && (
							<DownloadButton
								blob={result.icoBlob}
								filename={outputFilename}
								label="Download .ico"
								disabled={processing}
							/>
						)}
						<Button variant="outline" onClick={reset}>
							Generate another
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
