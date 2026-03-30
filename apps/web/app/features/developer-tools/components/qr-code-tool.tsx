import { useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatFileSize } from "~/lib/utils";
import {
	type ErrorCorrectionLevel,
	generateQrCode,
	MAX_QR_LENGTH,
	type QrCodeResult,
} from "../processors/qr-code";

const SIZE_OPTIONS = [
	{ value: "128", label: "128 px" },
	{ value: "256", label: "256 px" },
	{ value: "300", label: "300 px" },
	{ value: "512", label: "512 px" },
	{ value: "1024", label: "1024 px" },
];

const ERROR_CORRECTION_OPTIONS: {
	value: ErrorCorrectionLevel;
	label: string;
}[] = [
	{ value: "L", label: "L - Low (7%)" },
	{ value: "M", label: "M - Medium (15%)" },
	{ value: "Q", label: "Q - Quartile (25%)" },
	{ value: "H", label: "H - High (30%)" },
];

export default function QrCodeTool() {
	const [text, setText] = useState("");
	const [size, setSize] = useState(300);
	const [errorCorrection, setErrorCorrection] =
		useState<ErrorCorrectionLevel>("M");
	const [foreground, setForeground] = useState("#000000");
	const [background, setBackground] = useState("#ffffff");
	const [result, setResult] = useState<QrCodeResult | null>(null);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!text.trim()) {
			setResult(null);
			setError(null);
			return;
		}

		if (text.length > MAX_QR_LENGTH) {
			setError(`Content exceeds maximum length of ${MAX_QR_LENGTH} characters`);
			setResult(null);
			return;
		}

		const controller = new AbortController();
		setGenerating(true);

		(async () => {
			try {
				const qr = await generateQrCode({
					text,
					size,
					errorCorrection,
					foreground,
					background,
				});
				if (controller.signal.aborted) return;
				setResult(qr);
				setError(null);
				setGenerating(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Failed to generate QR code",
				);
				setResult(null);
				setGenerating(false);
			}
		})();

		return () => controller.abort();
	}, [text, size, errorCorrection, foreground, background]);

	return (
		<div className="space-y-6">
			{/* Text input */}
			<div className="space-y-2">
				<label htmlFor="qr-text" className="text-sm font-medium">
					Text or URL
				</label>
				<Textarea
					id="qr-text"
					placeholder="Enter text, URL, email, phone number, or any content..."
					value={text}
					onChange={(e) => setText(e.target.value)}
					className="min-h-24 font-mono text-sm"
				/>
				<p
					className={cn(
						"text-xs",
						text.length > MAX_QR_LENGTH
							? "text-destructive"
							: text.length > MAX_QR_LENGTH * 0.9
								? "text-amber-600 dark:text-amber-400"
								: "text-muted-foreground",
					)}
				>
					{text.length} / {MAX_QR_LENGTH} characters
				</p>
			</div>

			{/* Options panel */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div className="space-y-1.5">
					<label htmlFor="qr-size" className="text-xs font-medium">
						Size
					</label>
					<Select
						value={String(size)}
						onValueChange={(v) => setSize(Number(v))}
					>
						<SelectTrigger id="qr-size" aria-label="QR code size">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SIZE_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<label htmlFor="qr-ec" className="text-xs font-medium">
						Error Correction
					</label>
					<Select
						value={errorCorrection}
						onValueChange={(v) => setErrorCorrection(v as ErrorCorrectionLevel)}
					>
						<SelectTrigger id="qr-ec" aria-label="Error correction level">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ERROR_CORRECTION_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<label htmlFor="fg-color" className="text-xs font-medium">
						Foreground
					</label>
					<div className="flex items-center gap-2">
						<input
							id="fg-color"
							type="color"
							value={foreground}
							onChange={(e) => setForeground(e.target.value)}
							className="h-8 w-12 rounded border cursor-pointer"
						/>
						<span className="text-xs text-muted-foreground font-mono">
							{foreground}
						</span>
					</div>
				</div>

				<div className="space-y-1.5">
					<label htmlFor="bg-color" className="text-xs font-medium">
						Background
					</label>
					<div className="flex items-center gap-2">
						<input
							id="bg-color"
							type="color"
							value={background}
							onChange={(e) => setBackground(e.target.value)}
							className="h-8 w-12 rounded border cursor-pointer"
						/>
						<span className="text-xs text-muted-foreground font-mono">
							{background}
						</span>
					</div>
				</div>
			</div>

			{/* QR code preview */}
			{!text.trim() ? (
				<div className="flex items-center justify-center h-[300px] rounded-lg border-2 border-dashed border-muted-foreground/25">
					<p className="text-sm text-muted-foreground">
						Enter text or URL above to generate a QR code
					</p>
				</div>
			) : error ? (
				<div className="flex items-center justify-center h-[300px] rounded-lg border-2 border-dashed border-destructive/25">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			) : generating && !result ? (
				<div className="flex items-center justify-center h-[300px] rounded-lg border bg-card">
					<Spinner className="size-6" />
				</div>
			) : result ? (
				<div className="flex flex-col items-center gap-4">
					<div className="flex items-center justify-center p-4 rounded-lg border bg-card">
						<img
							src={result.pngDataUrl}
							alt="QR Code"
							style={{
								width: size,
								height: size,
								maxWidth: "100%",
							}}
						/>
					</div>

					<div className="flex items-center gap-3">
						<DownloadButton
							blob={result.pngBlob}
							filename="qr-code.png"
							label={`Download PNG (${formatFileSize(result.pngBlob.size)})`}
						/>
						<DownloadButton
							blob={result.svgBlob}
							filename="qr-code.svg"
							label={`Download SVG (${formatFileSize(result.svgBlob.size)})`}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
