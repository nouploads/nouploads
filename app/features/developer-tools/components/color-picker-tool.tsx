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

// ─── Copy button ──────────────────────────────────────────────

function CopyButton({
	text,
	size = "icon",
}: {
	text: string;
	size?: "icon" | "icon-xs";
}) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => setCopied(false), 1500);
		});
	}, [text]);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<Button
			variant="ghost"
			size={size}
			onClick={handleCopy}
			aria-label={copied ? "Copied" : "Copy to clipboard"}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5 text-primary" />
			) : (
				<Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
			)}
		</Button>
	);
}

// ─── Format cell (read-only, in 2-column grid) ───────────────

function FormatCell({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
			<span className="text-xs font-semibold text-muted-foreground uppercase shrink-0 w-12">
				{label}
			</span>
			<code className="flex-1 text-sm font-mono truncate">{value}</code>
			<CopyButton
				text={`${label === "HEX" ? "" : `${label.toLowerCase()}(`}${value}${label === "HEX" ? "" : ")"}`}
				size="icon-xs"
			/>
		</div>
	);
}

// ─── Image color picker ──────────────────────────────────────────

function ImageColorPicker({
	onColorPick,
}: {
	onColorPick: (hex: string) => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [imageLoaded, setImageLoaded] = useState(false);
	// Position of the last picked color as % of container (for the marker dot)
	const [pickedPos, setPickedPos] = useState<{
		xPct: number;
		yPct: number;
		color: string;
	} | null>(null);

	// Store the pending file so we can draw it after the canvas mounts
	const pendingFileRef = useRef<File | null>(null);

	const drawToCanvas = useCallback((file: File) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			const canvas = canvasRef.current;
			if (!canvas) {
				// Canvas not mounted yet — store for later
				pendingFileRef.current = file;
				setImageLoaded(true);
				URL.revokeObjectURL(url);
				return;
			}
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.drawImage(img, 0, 0);
			setImageLoaded(true);
			URL.revokeObjectURL(url);
		};
		img.src = url;
	}, []);

	// When canvas mounts and there's a pending file, draw it
	const canvasCallbackRef = useCallback(
		(node: HTMLCanvasElement | null) => {
			(canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
				node;
			if (node && pendingFileRef.current) {
				const file = pendingFileRef.current;
				pendingFileRef.current = null;
				drawToCanvas(file);
			}
		},
		[drawToCanvas],
	);

	const draggingRef = useRef(false);

	const pickAt = useCallback(
		(e: React.PointerEvent) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const xPct = Math.max(
				0,
				Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
			);
			const yPct = Math.max(
				0,
				Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
			);
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			const x = Math.floor((xPct / 100) * canvas.width);
			const y = Math.floor((yPct / 100) * canvas.height);
			const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
			const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
			setPickedPos({ xPct, yPct, color });
			onColorPick(color);
		},
		[onColorPick],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			draggingRef.current = true;
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
			const file = files[0];
			if (file) drawToCanvas(file);
		},
		[drawToCanvas],
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
		<div className="h-[280px] flex flex-col gap-1.5">
			<div
				className="relative flex-1 min-h-0 rounded-lg border overflow-hidden bg-muted/30 cursor-crosshair touch-none"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			>
				<canvas ref={canvasCallbackRef} className="h-full w-full" />
				{pickedPos && (
					<div
						className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
						style={{ left: `${pickedPos.xPct}%`, top: `${pickedPos.yPct}%` }}
					>
						<div className="h-3 w-3 rounded-full border-[1.5px] border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
					</div>
				)}
			</div>
			<button
				type="button"
				onClick={() => {
					setImageLoaded(false);
					setPickedPos(null);
				}}
				className="shrink-0 flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
			>
				<ImageIcon className="h-3 w-3" />
				Change image
			</button>
		</div>
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
						<CopyButton text={inputValue} size="icon" />
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

			{/* Format grid — 2 columns */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
				{FORMAT_DEFS.map((f) => (
					<FormatCell key={f.key} label={f.label} value={formats[f.key]} />
				))}
			</div>
		</div>
	);
}
