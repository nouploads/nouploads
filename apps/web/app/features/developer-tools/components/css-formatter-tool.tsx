import {
	Check,
	ClipboardCopy,
	Download,
	FileUp,
	Minimize2,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import {
	beautifyCss,
	type CssSavings,
	calculateSavings,
	MAX_CSS_SIZE,
	minifyCss,
} from "../processors/css-formatter";

const PLACEHOLDER_CSS = `body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}`;

export default function CssFormatterTool() {
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [savings, setSavings] = useState<CssSavings | null>(null);
	const [mode, setMode] = useState<"beautify" | "minify">("beautify");
	const [copied, setCopied] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Process on input or mode change
	useEffect(() => {
		if (!input.trim()) {
			setOutput("");
			setSavings(null);
			return;
		}

		try {
			const result = mode === "minify" ? minifyCss(input) : beautifyCss(input);
			setOutput(result);
			setSavings(calculateSavings(input, result));
		} catch {
			setOutput("");
			setSavings(null);
		}
	}, [input, mode]);

	const handleCopy = useCallback(async () => {
		if (!output) return;
		try {
			await navigator.clipboard.writeText(output);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard may be blocked
		}
	}, [output]);

	const handleDownload = useCallback(() => {
		if (!output) return;
		const blob = new Blob([output], { type: "text/css" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = mode === "minify" ? "minified.css" : "formatted.css";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [output, mode]);

	const handleClear = useCallback(() => {
		setInput("");
		setOutput("");
		setSavings(null);
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_CSS_SIZE) {
				setOutput(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_CSS_SIZE)}.`,
				);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				setInput(text);
			};
			reader.readAsText(file);

			// Reset file input so the same file can be re-selected
			e.target.value = "";
		},
		[],
	);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file) return;

		if (file.size > MAX_CSS_SIZE) {
			setOutput(
				`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_CSS_SIZE)}.`,
			);
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			setInput(text);
		};
		reader.readAsText(file);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					onClick={() => setMode("beautify")}
					variant={mode === "beautify" ? "default" : "secondary"}
					className="gap-1.5"
				>
					<Sparkles className="size-3.5" />
					Beautify
				</Button>
				<Button
					size="sm"
					onClick={() => setMode("minify")}
					variant={mode === "minify" ? "default" : "secondary"}
					className="gap-1.5"
				>
					<Minimize2 className="size-3.5" />
					Minify
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={handleCopy}
					disabled={!output}
					className="gap-1.5"
				>
					{copied ? (
						<Check className="size-3.5" />
					) : (
						<ClipboardCopy className="size-3.5" />
					)}
					{copied ? "Copied" : "Copy"}
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={handleDownload}
					disabled={!output}
					className="gap-1.5"
				>
					<Download className="size-3.5" />
					Download
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleClear}
					disabled={!input.trim()}
					className="gap-1.5"
				>
					<Trash2 className="size-3.5" />
					Clear
				</Button>
				<div className="ml-auto">
					<input
						ref={fileInputRef}
						type="file"
						accept=".css,text/css"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload CSS file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload .css
					</Button>
				</div>
			</div>

			{/* Size savings */}
			{savings && (
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>
						Original:{" "}
						<span className="font-medium text-foreground">
							{formatFileSize(savings.originalSize)}
						</span>
					</span>
					<span>
						Output:{" "}
						<span className="font-medium text-foreground">
							{formatFileSize(savings.outputSize)}
						</span>
					</span>
					{savings.savingsPercent !== 0 && (
						<Badge
							className={
								savings.savingsPercent > 0
									? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800"
									: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
							}
						>
							{savings.savingsPercent > 0
								? `${savings.savingsPercent}% smaller`
								: `${Math.abs(savings.savingsPercent)}% larger`}
						</Badge>
					)}
				</div>
			)}

			{/* Input area */}
			<div>
				<label htmlFor="css-input" className="text-sm font-medium mb-1.5 block">
					Input CSS
				</label>
				<Textarea
					id="css-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					placeholder={PLACEHOLDER_CSS}
					className="min-h-[250px] font-mono text-sm leading-relaxed resize-y"
					spellCheck={false}
					aria-label="CSS input"
				/>
			</div>

			{/* Output area */}
			<div>
				<label
					htmlFor="css-output"
					className="text-sm font-medium mb-1.5 block"
				>
					Output
				</label>
				<Textarea
					id="css-output"
					value={output}
					readOnly
					placeholder="Output will appear here..."
					className="min-h-[250px] font-mono text-sm leading-relaxed resize-y bg-muted/30"
					spellCheck={false}
					aria-label="CSS output"
				/>
			</div>
		</div>
	);
}
