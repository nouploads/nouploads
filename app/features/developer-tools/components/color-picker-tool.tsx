import { Check, Clipboard, Dices } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
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

	const formats = allFormats(hex);
	const textColor = bestTextColor(hex);
	const ratio = contrastRatio(hex, textColor);
	const level = wcagLevel(ratio);

	return (
		<div className="space-y-6">
			{/* Top: picker (left) + swatch preview (right) */}
			<div className="flex flex-col sm:flex-row gap-4">
				{/* Color picker — fixed size container */}
				<div className="shrink-0 flex flex-col gap-3">
					<div className="w-[360px] h-[280px]">
						<HexColorPicker
							color={hex}
							onChange={handlePickerChange}
							style={{ width: "100%", height: "100%" }}
						/>
					</div>
					{/* Format select + input + copy */}
					<div className="flex gap-2 items-center w-[360px]">
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
					<Button
						variant="outline"
						onClick={handleRandom}
						className="gap-2 w-[360px]"
					>
						<Dices className="h-4 w-4" />
						Random color
					</Button>
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
