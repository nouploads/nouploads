import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import type { PaletteColor } from "~/features/image-tools/processors/color-palette";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

function useCopyToClipboard(timeout = 2000) {
	const [copiedKey, setCopiedKey] = useState<string | null>(null);

	const copy = useCallback(
		(text: string, key: string) => {
			navigator.clipboard.writeText(text);
			setCopiedKey(key);
			setTimeout(() => setCopiedKey(null), timeout);
		},
		[timeout],
	);

	return { copiedKey, copy };
}

function CopyButton({
	text,
	label,
	copyKey,
	copiedKey,
	onCopy,
}: {
	text: string;
	label: string;
	copyKey: string;
	copiedKey: string | null;
	onCopy: (text: string, key: string) => void;
}) {
	const isCopied = copiedKey === copyKey;
	return (
		<Button
			variant="ghost"
			size="sm"
			className="h-7 gap-1.5 text-xs"
			onClick={() => onCopy(text, copyKey)}
		>
			{isCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
			{isCopied ? "Copied" : label}
		</Button>
	);
}

export default function ColorPaletteTool() {
	const [file, setFile] = useState<File | null>(null);
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
	const [colors, setColors] = useState<PaletteColor[]>([]);
	const [colorCount, setColorCount] = useState(6);
	const [extracting, setExtracting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { copiedKey, copy } = useCopyToClipboard();

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setColors([]);
		setError(null);
	}, []);

	// Create thumbnail URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setThumbnailUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Extract palette when file or color count changes
	useEffect(() => {
		if (!file) return;
		const controller = new AbortController();
		setExtracting(true);
		setError(null);

		(async () => {
			try {
				const { extractPaletteFromFile } = await import(
					"~/features/image-tools/processors/color-palette"
				);
				if (controller.signal.aborted) return;
				const result = await extractPaletteFromFile(
					file,
					colorCount,
					controller.signal,
				);
				if (controller.signal.aborted) return;
				setColors(result);
				setExtracting(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Failed to extract palette",
				);
				setExtracting(false);
			}
		})();

		return () => controller.abort();
	}, [file, colorCount]);

	const reset = useCallback(() => {
		setFile(null);
		setThumbnailUrl(null);
		setColors([]);
		setError(null);
	}, []);

	const handleCopyCss = useCallback(async () => {
		const { paletteToCssVariables } = await import(
			"~/features/image-tools/processors/color-palette"
		);
		const css = `:root {\n${paletteToCssVariables(colors)}\n}`;
		copy(css, "css");
	}, [colors, copy]);

	const handleCopyTailwind = useCallback(async () => {
		const { paletteToTailwind } = await import(
			"~/features/image-tools/processors/color-palette"
		);
		copy(paletteToTailwind(colors), "tailwind");
	}, [colors, copy]);

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_IMAGES} onFiles={handleFiles} />
					</div>
				)}

				{file && (
					<div className="space-y-6">
						{/* File info */}
						<div className="flex items-center gap-4 rounded-lg border bg-card p-4">
							{thumbnailUrl && (
								<img
									src={thumbnailUrl}
									alt={file.name}
									className="size-16 rounded-lg object-cover shrink-0"
								/>
							)}
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(file.size)} · {file.type || "unknown type"}
								</p>
							</div>
						</div>

						{/* Color count slider */}
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="color-count">
								Number of colors: {colorCount}
							</label>
							<Slider
								aria-label="Number of colors"
								id="color-count"
								min={3}
								max={12}
								step={1}
								value={[colorCount]}
								onValueChange={([v]) => setColorCount(v)}
							/>
						</div>

						{/* Extracting state */}
						{extracting && colors.length === 0 && (
							<div className="flex items-center gap-2 py-8 justify-center">
								<Spinner className="size-5" />
								<span className="text-sm text-muted-foreground">
									Extracting colors...
								</span>
							</div>
						)}

						{/* Error */}
						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						{/* Color swatches */}
						{colors.length > 0 && (
							<div className="space-y-4">
								<div className="flex flex-wrap gap-3">
									{colors.map((color) => (
										<button
											key={color.hex}
											type="button"
											className="group flex flex-col items-center gap-1.5 cursor-pointer"
											onClick={() => copy(color.hex, `swatch-${color.hex}`)}
											title={`Copy ${color.hex}`}
										>
											<div
												className="size-14 rounded-lg border shadow-sm transition-none group-hover:ring-2 group-hover:ring-primary/50"
												style={{ backgroundColor: color.hex }}
											/>
											<span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
												{copiedKey === `swatch-${color.hex}`
													? "Copied!"
													: color.hex}
											</span>
										</button>
									))}
								</div>

								{extracting && (
									<div className="flex items-center gap-2">
										<Spinner className="size-4" />
										<span className="text-xs text-muted-foreground">
											Updating...
										</span>
									</div>
								)}

								{/* Color table */}
								<div className="rounded-lg border overflow-hidden overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b bg-muted/30">
												<th className="px-3 py-2 text-left font-medium">
													Swatch
												</th>
												<th className="px-3 py-2 text-left font-medium">Hex</th>
												<th className="px-3 py-2 text-left font-medium">RGB</th>
												<th className="px-3 py-2 text-left font-medium">HSL</th>
												<th className="px-3 py-2 text-right font-medium">
													Copy
												</th>
											</tr>
										</thead>
										<tbody>
											{colors.map((color) => (
												<tr
													key={color.hex}
													className="border-b last:border-b-0"
												>
													<td className="px-3 py-2">
														<div
															className="size-6 rounded border"
															style={{ backgroundColor: color.hex }}
														/>
													</td>
													<td className="px-3 py-2 font-mono text-xs">
														{color.hex}
													</td>
													<td className="px-3 py-2 font-mono text-xs">
														{color.r}, {color.g}, {color.b}
													</td>
													<td className="px-3 py-2 font-mono text-xs">
														{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
													</td>
													<td className="px-3 py-2 text-right">
														<CopyButton
															text={color.hex}
															label="Hex"
															copyKey={`table-${color.hex}`}
															copiedKey={copiedKey}
															onCopy={copy}
														/>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Export buttons */}
								<div className="flex items-center gap-3">
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5"
										onClick={handleCopyCss}
									>
										{copiedKey === "css" ? (
											<Check className="size-3.5" />
										) : (
											<Copy className="size-3.5" />
										)}
										{copiedKey === "css" ? "Copied!" : "Copy as CSS Variables"}
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5"
										onClick={handleCopyTailwind}
									>
										{copiedKey === "tailwind" ? (
											<Check className="size-3.5" />
										) : (
											<Copy className="size-3.5" />
										)}
										{copiedKey === "tailwind" ? "Copied!" : "Copy as Tailwind"}
									</Button>
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							<Button variant="outline" onClick={reset}>
								Analyze another
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
