import { Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import type { OptimizeSvgResult } from "~/features/vector-tools/processors/optimize-svg";
import { formatFileSize } from "~/lib/utils";

const ACCEPT_SVG: Record<string, string[]> = {
	"image/svg+xml": [".svg"],
};

export default function SvgOptimizerTool() {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<OptimizeSvgResult | null>(null);
	const [svgzBlob, setSvgzBlob] = useState<Blob | null>(null);
	const [optimizing, setOptimizing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		if (!f) return;
		setFile(f);
		setResult(null);
		setSvgzBlob(null);
		setError(null);
	}, []);

	// Optimize when file changes
	useEffect(() => {
		if (!file) return;
		const controller = new AbortController();
		setOptimizing(true);
		setError(null);
		setResult(null);
		setSvgzBlob(null);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});

		(async () => {
			try {
				const { optimizeSvg, svgToSvgz } = await import(
					"~/features/vector-tools/processors/optimize-svg"
				);
				if (controller.signal.aborted) return;

				const res = await optimizeSvg(file, {
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;

				const blob = new Blob([res.svg], { type: "image/svg+xml" });
				const url = URL.createObjectURL(blob);
				setResult(res);
				setPreviewUrl(url);
				setOptimizing(false);

				// Generate SVGZ in background
				const gzipped = await svgToSvgz(res.svg);
				if (controller.signal.aborted) return;
				setSvgzBlob(gzipped);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Failed to optimize SVG");
				setOptimizing(false);
			}
		})();

		return () => {
			controller.abort();
			setPreviewUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
		};
	}, [file]);

	const handleReset = useCallback(() => {
		setFile(null);
		setResult(null);
		setSvgzBlob(null);
		setError(null);
		setOptimizing(false);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
	}, []);

	const outputFilename = file
		? file.name.replace(/\.svg$/i, ".min.svg")
		: "optimized.svg";
	const svgzFilename = file
		? file.name.replace(/\.svg$/i, ".svgz")
		: "optimized.svgz";

	const reductionPct =
		result && result.originalSize > 0
			? Math.round(
					((result.originalSize - result.optimizedSize) / result.originalSize) *
						100,
				)
			: 0;

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_SVG} onFiles={handleFiles} />
					</div>
				)}

				{file && (
					<div className="space-y-6">
						{/* File info */}
						<div className="flex items-center gap-4 rounded-lg border bg-card p-4">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(file.size)}
								</p>
							</div>
						</div>

						{/* Optimizing state */}
						{optimizing && (
							<div className="flex items-center gap-2 py-8 justify-center">
								<Spinner className="size-5" />
								<span className="text-sm text-muted-foreground">
									Optimizing SVG...
								</span>
							</div>
						)}

						{/* Error */}
						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						{/* Results */}
						{result && (
							<div className="space-y-6">
								{/* Size comparison */}
								<div className="rounded-lg border bg-muted/30 p-4">
									<div className="flex items-center gap-4 text-sm">
										<span className="text-muted-foreground">
											Original: {formatFileSize(result.originalSize)}
										</span>
										<span className="text-muted-foreground">&rarr;</span>
										<span className="font-medium">
											Optimized: {formatFileSize(result.optimizedSize)}
										</span>
										{reductionPct > 0 && (
											<span className="text-sm font-medium text-green-600 dark:text-green-400">
												&minus;{reductionPct}%
											</span>
										)}
									</div>
									{svgzBlob && (
										<p className="text-xs text-muted-foreground mt-2">
											SVGZ (gzipped): {formatFileSize(svgzBlob.size)}
										</p>
									)}
								</div>

								{/* Preview */}
								{previewUrl && (
									<div className="rounded-lg border p-4">
										<h3 className="text-sm font-medium mb-3">Preview</h3>
										<div className="flex items-center justify-center bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23ccc%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23ccc%22/%3E%3C/svg%3E')] rounded-md p-2">
											<img
												src={previewUrl}
												alt="Optimized SVG preview"
												className="max-h-64 max-w-full object-contain"
											/>
										</div>
									</div>
								)}

								{/* Download buttons */}
								<div className="flex flex-wrap items-center gap-3">
									<DownloadButton
										blob={new Blob([result.svg], { type: "image/svg+xml" })}
										filename={outputFilename}
										label={`Download SVG (${formatFileSize(result.optimizedSize)})`}
									/>
									{svgzBlob && (
										<DownloadButton
											blob={svgzBlob}
											filename={svgzFilename}
											label={`Download SVGZ (${formatFileSize(svgzBlob.size)})`}
										/>
									)}
								</div>
							</div>
						)}

						{/* Reset */}
						<Button variant="outline" onClick={handleReset} className="gap-1.5">
							<Upload className="h-3.5 w-3.5" />
							Optimize another SVG
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
