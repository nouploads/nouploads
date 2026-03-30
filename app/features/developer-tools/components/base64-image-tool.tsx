import {
	AlertTriangle,
	Check,
	Code,
	Copy,
	ImageIcon,
	Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import {
	type Base64DecodeResult,
	type Base64EncodeResult,
	decodeBase64ToImage,
	encodeImageToBase64,
} from "../processors/base64-image";

// ─── Copy button ──────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setCopied(false), 2000);
	}, [text]);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleCopy}
			className="gap-1.5"
		>
			{copied ? (
				<Check className="h-3.5 w-3.5" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
			{copied ? "Copied" : "Copy"}
		</Button>
	);
}

// ─── Encode tab ───────────────────────────────────────────────

function EncodeTab() {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<Base64EncodeResult | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [encoding, setEncoding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		if (!f) return;
		setFile(f);
		setResult(null);
		setError(null);
		setEncoding(true);

		const url = URL.createObjectURL(f);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return url;
		});

		encodeImageToBase64(f)
			.then((r) => {
				setResult(r);
				setEncoding(false);
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to encode");
				setEncoding(false);
			});
	}, []);

	const handleReset = useCallback(() => {
		setFile(null);
		setResult(null);
		setError(null);
		setEncoding(false);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
	}, []);

	if (!file) {
		return (
			<div className="h-[200px]">
				<ToolDropzone accept={ACCEPT_IMAGES} onFiles={handleFiles} />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* File info + preview */}
			<div className="flex items-start gap-4 rounded-lg border p-4">
				{previewUrl && (
					<img
						src={previewUrl}
						alt={file.name}
						className="h-16 w-16 shrink-0 rounded object-cover"
					/>
				)}
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium truncate">{file.name}</p>
					<p className="text-xs text-muted-foreground">
						{file.type || "unknown type"} · {formatFileSize(file.size)}
					</p>
					{result && (
						<p className="text-xs text-muted-foreground mt-1">
							Base64 length: {formatFileSize(result.base64Length)} (
							{Math.round((result.base64Length / result.byteLength) * 100)}% of
							original)
						</p>
					)}
				</div>
			</div>

			{encoding && (
				<div className="flex items-center justify-center py-8">
					<Spinner className="size-6" />
				</div>
			)}

			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
					{error}
				</div>
			)}

			{result && (
				<>
					{result.base64Length > 1_000_000 && (
						<div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
							<AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
							<p className="text-sm text-amber-600 dark:text-amber-400">
								This base64 string is {formatFileSize(result.base64Length)} —
								embedding large images as base64 can significantly increase page
								load times.
							</p>
						</div>
					)}

					{/* Data URI */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Data URI</h3>
							<CopyButton text={result.dataUri} />
						</div>
						<Textarea
							readOnly
							value={result.dataUri}
							className="font-mono text-xs h-40 resize-none"
							onClick={(e) => (e.target as HTMLTextAreaElement).select()}
						/>
					</div>

					{/* Raw Base64 */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-medium">Raw Base64</h3>
							<CopyButton text={result.rawBase64} />
						</div>
						<Textarea
							readOnly
							value={result.rawBase64}
							className="font-mono text-xs h-40 resize-none"
							onClick={(e) => (e.target as HTMLTextAreaElement).select()}
						/>
					</div>
				</>
			)}

			<Button variant="outline" onClick={handleReset} className="gap-1.5">
				<Upload className="h-3.5 w-3.5" />
				Encode another image
			</Button>
		</div>
	);
}

// ─── Decode tab ───────────────────────────────────────────────

function DecodeTab() {
	const [input, setInput] = useState("");
	const [result, setResult] = useState<Base64DecodeResult | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [decoding, setDecoding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const decode = useCallback((value: string) => {
		const trimmed = value.trim();
		if (!trimmed) {
			setResult(null);
			setError(null);
			setPreviewUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
			return;
		}

		setDecoding(true);
		setError(null);

		decodeBase64ToImage(trimmed)
			.then((r) => {
				setResult(r);
				setDecoding(false);
				const url = URL.createObjectURL(r.blob);
				setPreviewUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return url;
				});
			})
			.catch((err) => {
				setResult(null);
				setDecoding(false);
				setError(err instanceof Error ? err.message : "Failed to decode");
				setPreviewUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return null;
				});
			});
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const value = e.target.value;
			setInput(value);

			clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				decode(value);
			}, 500);
		},
		[decode],
	);

	useEffect(() => {
		return () => clearTimeout(debounceRef.current);
	}, []);

	const extensionMap: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/svg+xml": "svg",
		"image/avif": "avif",
		"image/bmp": "bmp",
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="base64-input" className="text-sm font-medium">
					Paste base64 string or data URI
				</label>
				<Textarea
					id="base64-input"
					value={input}
					onChange={handleChange}
					placeholder={"data:image/png;base64,iVBORw0KGgo..."}
					className="font-mono text-xs h-40 resize-none"
				/>
			</div>

			{decoding && (
				<div className="flex items-center justify-center py-8">
					<Spinner className="size-6" />
				</div>
			)}

			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
					{error}
				</div>
			)}

			{result && previewUrl && (
				<div className="space-y-4">
					<div className="rounded-lg border p-4">
						<div className="flex items-start gap-4">
							<img
								src={previewUrl}
								alt="Decoded output"
								className="max-h-64 max-w-full rounded object-contain"
							/>
						</div>
						<div className="mt-3 space-y-1">
							<p className="text-sm text-muted-foreground">
								Format: {result.mimeType}
							</p>
							{result.width && result.height && (
								<p className="text-sm text-muted-foreground">
									Dimensions: {result.width} x {result.height}
								</p>
							)}
							<p className="text-sm text-muted-foreground">
								Size: {formatFileSize(result.blob.size)}
							</p>
						</div>
					</div>
					<DownloadButton
						blob={result.blob}
						filename={`decoded-image.${extensionMap[result.mimeType] || "png"}`}
					/>
				</div>
			)}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────

export default function Base64ImageTool() {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="encode">
				<TabsList>
					<TabsTrigger value="encode" className="gap-1.5">
						<ImageIcon className="h-3.5 w-3.5" />
						Encode Image to Base64
					</TabsTrigger>
					<TabsTrigger value="decode" className="gap-1.5">
						<Code className="h-3.5 w-3.5" />
						Decode Base64 to Image
					</TabsTrigger>
				</TabsList>
				<TabsContent value="encode">
					<EncodeTab />
				</TabsContent>
				<TabsContent value="decode">
					<DecodeTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
