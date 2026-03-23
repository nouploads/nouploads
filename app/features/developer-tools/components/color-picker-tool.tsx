import {
	Check,
	Clipboard,
	Dices,
	ImageIcon,
	Palette,
	Pipette,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
	FullscreenOverlay,
	FullscreenToggle,
	useFullscreen,
} from "~/components/tool/fullscreen";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GifFrameSelector } from "~/features/image-tools/components/gif-frame-selector";
import {
	allFormats,
	bestTextColor,
	type ColorFormat,
	contrastRatio,
	FORMAT_DEFS,
	formatColor,
	parseToHex,
	randomHexColor,
	wcagLevel,
} from "../processors/color-picker";

const STORAGE_KEY = "colorPickerFormat";
const DEFAULT_COLOR = "#3b82f6";

function readStoredFormat(): ColorFormat {
	if (typeof window === "undefined") return "hex";
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && FORMAT_DEFS.some((f) => f.key === stored)) {
		return stored as ColorFormat;
	}
	return "hex";
}

// ─── Format cell (clickable, copies on click) ───────────────

function FormatCell({ label, value }: { label: string; value: string }) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	const copyText = label === "HEX" ? value : `${label.toLowerCase()}(${value})`;

	const handleClick = useCallback(() => {
		navigator.clipboard.writeText(copyText).then(() => {
			setCopied(true);
			clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => setCopied(false), 1500);
		});
	}, [copyText]);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<button
			type="button"
			onClick={handleClick}
			className="group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left hover:bg-muted/50 transition-colors cursor-pointer"
		>
			<span className="text-xs font-semibold text-muted-foreground uppercase shrink-0 w-10">
				{label}
			</span>
			<code className="flex-1 text-xs font-mono truncate">{value}</code>
			{copied ? (
				<Check className="h-3 w-3 shrink-0 text-primary" />
			) : (
				<Clipboard className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
			)}
		</button>
	);
}

// ─── Image color picker ──────────────────────────────────────────

function ImageColorPicker({
	onColorPick,
}: {
	onColorPick: (hex: string) => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [file, setFile] = useState<File | null>(null);
	const isGif = file?.type === "image/gif";
	const { fullscreen, toggleFullscreen, exitFullscreen } = useFullscreen({
		enabled: imageLoaded,
	});
	// Position of the last picked color as % of container (for the marker dot)
	const [pickedPos, setPickedPos] = useState<{
		xPct: number;
		yPct: number;
		color: string;
	} | null>(null);

	/** Load a File or Blob into the offscreen canvas + visible img */
	const loadImage = useCallback((source: File | Blob) => {
		const url = URL.createObjectURL(source);
		const img = new Image();
		img.onload = () => {
			// Draw to an offscreen canvas for pixel sampling
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.drawImage(img, 0, 0);
			canvasRef.current = canvas;
			// Revoke previous src before setting new one
			setImageSrc((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return url;
			});
			setImageLoaded(true);
		};
		img.src = url;
	}, []);

	/** Called by GifFrameSelector when user picks a frame */
	const handleGifFrameSelect = useCallback(
		(frameBlob: Blob) => {
			loadImage(frameBlob);
		},
		[loadImage],
	);

	const draggingRef = useRef(false);
	const containerRef = useRef<HTMLElement | null>(null);

	/** Map pointer position to the visible image rect (object-contain) */
	const pickAt = useCallback(
		(e: React.PointerEvent) => {
			const canvas = canvasRef.current;
			const container = containerRef.current;
			const imgEl = container?.querySelector("img");
			if (!canvas || !imgEl) return;

			// Compute the actual rendered image rect inside the container
			const rect = imgEl.getBoundingClientRect();
			const imgAspect = canvas.width / canvas.height;
			const boxAspect = rect.width / rect.height;

			let imgLeft: number;
			let imgTop: number;
			let imgW: number;
			let imgH: number;

			if (imgAspect > boxAspect) {
				// Image is wider — pillarboxed vertically
				imgW = rect.width;
				imgH = rect.width / imgAspect;
				imgLeft = rect.left;
				imgTop = rect.top + (rect.height - imgH) / 2;
			} else {
				// Image is taller — letterboxed horizontally
				imgH = rect.height;
				imgW = rect.height * imgAspect;
				imgLeft = rect.left + (rect.width - imgW) / 2;
				imgTop = rect.top;
			}

			// Ignore picks outside the actual image area
			const rawXPct = ((e.clientX - imgLeft) / imgW) * 100;
			const rawYPct = ((e.clientY - imgTop) / imgH) * 100;
			if (rawXPct < 0 || rawXPct > 100 || rawYPct < 0 || rawYPct > 100) return;

			const xPct = Math.max(0, Math.min(100, rawXPct));
			const yPct = Math.max(0, Math.min(100, rawYPct));

			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const x = Math.floor((xPct / 100) * canvas.width);
			const y = Math.floor((yPct / 100) * canvas.height);
			const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
			const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

			// Position the marker relative to the image rect, not the container
			const markerLeftPct = ((e.clientX - rect.left) / rect.width) * 100;
			const markerTopPct = ((e.clientY - rect.top) / rect.height) * 100;

			setPickedPos({
				xPct: Math.max(0, Math.min(100, markerLeftPct)),
				yPct: Math.max(0, Math.min(100, markerTopPct)),
				color,
			});
			onColorPick(color);
		},
		[onColorPick],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			// Blur any focused input so F key shortcut works after picking
			if (document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}
			draggingRef.current = true;
			containerRef.current = e.currentTarget as HTMLElement;
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
			pickAt(e);
		},
		[pickAt],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!draggingRef.current) return;
			pickAt(e);
		},
		[pickAt],
	);

	const handlePointerUp = useCallback(() => {
		draggingRef.current = false;
	}, []);

	const handleDropzoneFiles = useCallback(
		(files: File[]) => {
			const f = files[0];
			if (!f) return;
			setFile(f);
			if (f.type === "image/gif") {
				// GifFrameSelector will call handleGifFrameSelect with the first frame
				setImageLoaded(true);
			} else {
				loadImage(f);
			}
		},
		[loadImage],
	);

	return !imageLoaded ? (
		<div className="h-[280px]">
			<ToolDropzone
				accept={{
					"image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"],
				}}
				onFiles={handleDropzoneFiles}
			/>
		</div>
	) : (
		<>
			<div className={`flex flex-col gap-1.5 ${isGif ? "" : "h-[280px]"}`}>
				<div
					className={`relative rounded-lg border overflow-hidden bg-muted/30 cursor-crosshair touch-none ${isGif ? "h-[200px]" : "flex-1 min-h-0"}`}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
				>
					<img
						src={imageSrc ?? undefined}
						alt="Uploaded"
						className="h-full w-full object-contain"
						draggable={false}
					/>
					{pickedPos && (
						<div
							className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
							style={{ left: `${pickedPos.xPct}%`, top: `${pickedPos.yPct}%` }}
						>
							<div className="h-3 w-3 rounded-full border-[1.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
						</div>
					)}
				</div>
				{isGif && file && (
					<GifFrameSelector file={file} onFrameSelect={handleGifFrameSelect} />
				)}
				<div className="shrink-0 flex gap-1.5">
					<button
						type="button"
						onClick={() => {
							if (imageSrc) URL.revokeObjectURL(imageSrc);
							setImageSrc(null);
							setImageLoaded(false);
							setPickedPos(null);
							setFile(null);
							exitFullscreen();
							canvasRef.current = null;
						}}
						className="flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
					>
						<ImageIcon className="h-3 w-3" />
						Change image
					</button>
					<FullscreenToggle
						fullscreen={fullscreen}
						onToggle={toggleFullscreen}
						variant="inline"
					/>
				</div>
			</div>
			<FullscreenOverlay
				className="cursor-crosshair touch-none"
				visible={fullscreen}
			>
				<div
					className="relative h-full w-full"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
				>
					<img
						src={imageSrc ?? undefined}
						alt="Uploaded"
						className="h-full w-full object-contain"
						draggable={false}
					/>
					{pickedPos && (
						<div
							className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
							style={{
								left: `${pickedPos.xPct}%`,
								top: `${pickedPos.yPct}%`,
							}}
						>
							<div className="h-3 w-3 rounded-full border-[1.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
						</div>
					)}
					<FullscreenToggle
						fullscreen={fullscreen}
						onToggle={toggleFullscreen}
					/>
				</div>
			</FullscreenOverlay>
		</>
	);
}

// ─── Main component ───────────────────────────────────────────

export default function ColorPickerTool() {
	const [hex, setHex] = useState(DEFAULT_COLOR);
	const [format, setFormat] = useState<ColorFormat>("hex");
	const [inputValue, setInputValue] = useState(DEFAULT_COLOR);
	const [inputDirty, setInputDirty] = useState(false);

	// Load format preference on mount
	useEffect(() => {
		const stored = readStoredFormat();
		setFormat(stored);
		setInputValue(formatColor(DEFAULT_COLOR, stored));
	}, []);

	// Sync input text when hex or format changes (but not when user is typing)
	useEffect(() => {
		if (!inputDirty) {
			setInputValue(formatColor(hex, format));
		}
	}, [hex, format, inputDirty]);

	const handleFormatChange = useCallback(
		(value: string) => {
			const f = value as ColorFormat;
			setFormat(f);
			localStorage.setItem(STORAGE_KEY, f);
			setInputDirty(false);
			setInputValue(formatColor(hex, f));
		},
		[hex],
	);

	const handlePickerChange = useCallback(
		(newHex: string) => {
			setHex(newHex);
			setInputDirty(false);
			setInputValue(formatColor(newHex, format));
		},
		[format],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const v = e.target.value;
			setInputValue(v);
			setInputDirty(true);

			const parsed = parseToHex(v);
			if (parsed) {
				setHex(parsed);
			}
		},
		[],
	);

	const handleInputBlur = useCallback(() => {
		setInputDirty(false);
		setInputValue(formatColor(hex, format));
	}, [hex, format]);

	const handleRandom = useCallback(() => {
		const newHex = randomHexColor();
		setHex(newHex);
		setInputDirty(false);
		setInputValue(formatColor(newHex, format));
	}, [format]);

	const [eyeDropperSupported, setEyeDropperSupported] = useState(false);
	useEffect(() => {
		setEyeDropperSupported("EyeDropper" in window);
	}, []);

	const handleEyeDropper = useCallback(async () => {
		try {
			// @ts-expect-error EyeDropper API not yet in all TS libs
			const dropper = new EyeDropper();
			const result = await dropper.open();
			const picked = parseToHex(result.sRGBHex);
			if (picked) {
				setHex(picked);
				setInputDirty(false);
				setInputValue(formatColor(picked, format));
			}
		} catch {
			// User cancelled — do nothing
		}
	}, [format]);

	const handleImageColorPick = useCallback(
		(pickedHex: string) => {
			setHex(pickedHex);
			setInputDirty(false);
			setInputValue(formatColor(pickedHex, format));
		},
		[format],
	);

	const formats = allFormats(hex);
	const textColor = bestTextColor(hex);
	const ratio = contrastRatio(hex, textColor);
	const level = wcagLevel(ratio);

	return (
		<div className="space-y-6">
			{/* Top: picker (left) + swatch preview (right) */}
			<div className="flex flex-col sm:flex-row gap-4">
				{/* Color picker — fixed size container */}
				<div className="shrink-0 flex flex-col gap-3 w-[360px]">
					<Tabs defaultValue="spectrum">
						<TabsList className="w-full">
							<TabsTrigger value="spectrum" className="gap-1.5">
								<Palette className="h-3.5 w-3.5" />
								Spectrum
							</TabsTrigger>
							<TabsTrigger value="image" className="gap-1.5">
								<ImageIcon className="h-3.5 w-3.5" />
								Image
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="spectrum"
							forceMount
							className="data-[state=inactive]:hidden"
						>
							<div className="h-[280px]">
								<HexColorPicker
									color={hex}
									onChange={handlePickerChange}
									style={{ width: "100%", height: "100%" }}
								/>
							</div>
						</TabsContent>
						<TabsContent
							value="image"
							forceMount
							className="data-[state=inactive]:hidden"
						>
							<ImageColorPicker onColorPick={handleImageColorPick} />
						</TabsContent>
					</Tabs>
					{/* Format select + input + copy */}
					<div className="flex gap-2 items-center">
						<Select value={format} onValueChange={handleFormatChange}>
							<SelectTrigger
								className="w-[110px] shrink-0"
								aria-label="Color format"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{FORMAT_DEFS.map((f) => (
									<SelectItem key={f.key} value={f.key}>
										{f.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							value={inputValue}
							onChange={handleInputChange}
							onBlur={handleInputBlur}
							className="font-mono text-sm"
							aria-label="Color value"
						/>
					</div>
					<div className="flex gap-2">
						{eyeDropperSupported && (
							<Button
								variant="outline"
								onClick={handleEyeDropper}
								className="gap-2 flex-1"
							>
								<Pipette className="h-4 w-4" />
								Pick from screen
							</Button>
						)}
						<Button
							variant="outline"
							onClick={handleRandom}
							className="gap-2 flex-1"
						>
							<Dices className="h-4 w-4" />
							Random color
						</Button>
					</div>
				</div>

				{/* Large color swatch + contrast */}
				<div className="flex-1 flex flex-col gap-4">
					<div
						className="rounded-xl border flex-1 min-h-[200px] flex items-center justify-center transition-none"
						style={{ backgroundColor: hex, color: textColor }}
					>
						<span className="text-3xl font-mono font-bold select-all">
							{hex}
						</span>
					</div>
					<div
						className="rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-none"
						style={{ backgroundColor: hex, color: textColor }}
					>
						{textColor === "#ffffff" ? "White" : "Black"} text ·{" "}
						{ratio.toFixed(1)}:1 · WCAG {level}
					</div>
				</div>
			</div>

			{/* Format grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
				{FORMAT_DEFS.map((f) => (
					<FormatCell key={f.key} label={f.label} value={formats[f.key]} />
				))}
			</div>
		</div>
	);
}
