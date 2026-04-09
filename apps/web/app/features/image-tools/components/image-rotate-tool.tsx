import {
	AlertCircle,
	FlipHorizontal2,
	FlipVertical2,
	RotateCcw,
	RotateCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import { getImageDimensions } from "../processors/resize-image";
import {
	type RotateAction,
	type RotateImageResult,
	rotateImage,
} from "../processors/rotate-image";

const ACTIONS: {
	value: RotateAction;
	label: string;
	icon: typeof RotateCw;
}[] = [
	{ value: "rotate-ccw", label: "Rotate Left", icon: RotateCcw },
	{ value: "rotate-cw", label: "Rotate Right", icon: RotateCw },
	{ value: "rotate-180", label: "Rotate 180\u00B0", icon: RotateCw },
	{ value: "flip-h", label: "Flip Horizontal", icon: FlipHorizontal2 },
	{ value: "flip-v", label: "Flip Vertical", icon: FlipVertical2 },
];

function mimeForFile(file: File): "image/jpeg" | "image/png" | "image/webp" {
	if (file.type === "image/jpeg") return "image/jpeg";
	if (file.type === "image/webp") return "image/webp";
	return "image/png";
}

function extensionForMime(
	mime: "image/jpeg" | "image/png" | "image/webp",
): string {
	switch (mime) {
		case "image/jpeg":
			return "jpg";
		case "image/webp":
			return "webp";
		default:
			return "png";
	}
}

function toOutputFilename(
	name: string,
	mime: "image/jpeg" | "image/png" | "image/webp",
): string {
	const ext = `.${extensionForMime(mime)}`;
	return name.replace(/\.[^.]+$/, `-rotated${ext}`);
}

export default function ImageRotateTool() {
	const [file, setFile] = useState<File | null>(null);
	const [originalDimensions, setOriginalDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);

	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [resultDimensions, setResultDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// The current working blob: start with the file, then chain transforms
	const [workingBlob, setWorkingBlob] = useState<Blob | null>(null);
	const [workingDimensions, setWorkingDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		const f = incoming[0];
		setFile(f);
		setWorkingBlob(f);
		setResultUrl(null);
		setResultBlob(null);
		setResultDimensions(null);
		setError(null);
	}, []);

	// Get original dimensions when file changes
	useEffect(() => {
		if (!file) return;
		const controller = new AbortController();
		(async () => {
			try {
				const dims = await getImageDimensions(file);
				if (controller.signal.aborted) return;
				setOriginalDimensions(dims);
				setWorkingDimensions(dims);
			} catch {
				// ignore
			}
		})();
		return () => controller.abort();
	}, [file]);

	// Create original preview URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const outputMime = file ? mimeForFile(file) : "image/png";

	const handleAction = useCallback(
		(action: RotateAction) => {
			const blob = resultBlob || workingBlob;
			if (!blob) return;

			const controller = new AbortController();
			setProcessing(true);
			setError(null);

			const qualityParam = outputMime === "image/png" ? undefined : 0.95;

			(async () => {
				try {
					const result: RotateImageResult = await rotateImage(blob, {
						action,
						outputFormat: outputMime,
						quality: qualityParam,
						signal: controller.signal,
					});
					if (controller.signal.aborted) return;

					setResultBlob(result.blob);
					setResultDimensions({
						width: result.width,
						height: result.height,
					});
					setResultUrl((prev) => {
						if (prev) URL.revokeObjectURL(prev);
						return URL.createObjectURL(result.blob);
					});
					setProcessing(false);
				} catch (err) {
					if (controller.signal.aborted) return;
					setError(err instanceof Error ? err.message : "Transform failed");
					setProcessing(false);
				}
			})();

			return () => controller.abort();
		},
		[workingBlob, resultBlob, outputMime],
	);

	const reset = useCallback(() => {
		setFile(null);
		setOriginalDimensions(null);
		setOriginalUrl(null);
		setWorkingBlob(null);
		setWorkingDimensions(null);
		setResultUrl(null);
		setResultBlob(null);
		setResultDimensions(null);
		setError(null);
	}, []);

	const resetTransform = useCallback(() => {
		if (file) {
			setWorkingBlob(file);
			setWorkingDimensions(originalDimensions);
		}
		setResultUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		setResultBlob(null);
		setResultDimensions(null);
		setError(null);
	}, [file, originalDimensions]);

	const outputFilename = file ? toOutputFilename(file.name, outputMime) : "";
	const previewUrl = resultUrl || originalUrl;
	const currentDimensions =
		resultDimensions || workingDimensions || originalDimensions;

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
					{/* Action buttons */}
					<div className="flex flex-wrap gap-2">
						{ACTIONS.map((a) => (
							<Button
								key={a.value}
								variant="outline"
								size="sm"
								disabled={processing}
								onClick={() => handleAction(a.value)}
								className="gap-1.5"
							>
								<a.icon className="h-4 w-4" />
								{a.label}
							</Button>
						))}
					</div>

					{/* Info line */}
					<div className="flex justify-between">
						<div>
							<p className="text-sm font-medium">Original</p>
							<p className="text-xs text-muted-foreground">
								{file.name} —{" "}
								{originalDimensions
									? `${originalDimensions.width}x${originalDimensions.height}`
									: ""}{" "}
								— {formatFileSize(file.size)}
							</p>
						</div>
						{resultBlob && (
							<div className="text-right">
								<p className="text-sm font-medium">Result</p>
								<p className="text-xs text-muted-foreground relative">
									<span
										className="inline-flex items-center gap-1.5 transition-opacity duration-300"
										style={{ opacity: processing ? 1 : 0 }}
									>
										<Spinner className="size-3 inline" /> Transforming...
									</span>
									{resultDimensions && (
										<span
											className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
											style={{ opacity: processing ? 0 : 1 }}
										>
											{resultDimensions.width}x{resultDimensions.height} —{" "}
											{formatFileSize(resultBlob.size)}
										</span>
									)}
								</p>
							</div>
						)}
					</div>

					{/* Preview area */}
					{error ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
							<div className="flex flex-col items-center gap-2 p-4 text-center">
								<AlertCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						</div>
					) : previewUrl ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px] relative">
							<img
								src={previewUrl}
								alt={resultUrl ? "Transformed result" : "Original"}
								className="max-w-full max-h-full object-contain transition-opacity duration-300"
								style={{ opacity: processing ? 0.4 : 1 }}
							/>
							{processing && (
								<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none transition-opacity duration-300">
									<Spinner className="size-10" />
								</div>
							)}
							{currentDimensions && !processing && (
								<span className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
									{currentDimensions.width}x{currentDimensions.height}
								</span>
							)}
						</div>
					) : null}

					{/* Actions */}
					<div className="flex items-center gap-3 h-9">
						{resultBlob && (
							<DownloadButton
								blob={resultBlob}
								filename={outputFilename}
								disabled={processing}
							/>
						)}
						{resultBlob && (
							<Button variant="outline" onClick={resetTransform}>
								Reset
							</Button>
						)}
						<Button variant="outline" onClick={reset}>
							Choose another
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
