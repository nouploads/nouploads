import {
	Check,
	ClipboardCopy,
	Download,
	FileUp,
	Minimize2,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import {
	computeJsonStats,
	formatJson,
	type JsonStats,
	MAX_JSON_SIZE,
	minifyJson,
	validateJson,
} from "../processors/json-formatter";

const PLACEHOLDER_JSON = `{
  "name": "example",
  "version": "1.0.0",
  "tags": ["json", "formatter"],
  "nested": {
    "key": "value"
  }
}`;

export default function JsonFormatterTool() {
	const [input, setInput] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const [stats, setStats] = useState<JsonStats | null>(null);
	const [copied, setCopied] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Validate on every input change
	useEffect(() => {
		if (!input.trim()) {
			setIsValid(null);
			setValidationError(null);
			setStats(null);
			return;
		}

		const result = validateJson(input);
		setIsValid(result.valid);
		setValidationError(result.error ?? null);

		if (result.valid) {
			setStats(computeJsonStats(input));
		} else {
			setStats(null);
		}
	}, [input]);

	const handleFormat = useCallback(() => {
		if (!input.trim() || !isValid) return;
		try {
			const formatted = formatJson(input, 2);
			setInput(formatted);
		} catch {
			// validation already handles errors
		}
	}, [input, isValid]);

	const handleMinify = useCallback(() => {
		if (!input.trim() || !isValid) return;
		try {
			const minified = minifyJson(input);
			setInput(minified);
		} catch {
			// validation already handles errors
		}
	}, [input, isValid]);

	const handleCopy = useCallback(async () => {
		const textToCopy = input;
		if (!textToCopy) return;
		try {
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard may be blocked in some environments
		}
	}, [input]);

	const handleDownload = useCallback(() => {
		if (!input.trim()) return;
		const blob = new Blob([input], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "formatted.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [input]);

	const handleClear = useCallback(() => {
		setInput("");
		setIsValid(null);
		setValidationError(null);
		setStats(null);
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_JSON_SIZE) {
				setValidationError(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_JSON_SIZE)}.`,
				);
				setIsValid(false);
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

		if (file.size > MAX_JSON_SIZE) {
			setValidationError(
				`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_JSON_SIZE)}.`,
			);
			setIsValid(false);
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
					onClick={handleFormat}
					disabled={!isValid}
					className="gap-1.5"
				>
					<Sparkles className="size-3.5" />
					Format
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={handleMinify}
					disabled={!isValid}
					className="gap-1.5"
				>
					<Minimize2 className="size-3.5" />
					Minify
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={handleCopy}
					disabled={!input.trim()}
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
					disabled={!input.trim()}
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
						accept=".json,application/json"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload JSON file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload .json
					</Button>
				</div>
			</div>

			{/* Validation status */}
			{isValid !== null && (
				<div className="flex flex-wrap items-center gap-2">
					{isValid ? (
						<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
							<Check className="size-3" />
							Valid JSON
						</Badge>
					) : (
						<Badge variant="destructive" className="gap-1">
							<X className="size-3" />
							Invalid JSON
						</Badge>
					)}
					{validationError && (
						<span className="text-xs text-destructive">{validationError}</span>
					)}
				</div>
			)}

			{/* Editor area */}
			<Textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				placeholder={PLACEHOLDER_JSON}
				className="min-h-[400px] font-mono text-sm leading-relaxed resize-y"
				spellCheck={false}
				aria-label="JSON input"
			/>

			{/* Statistics */}
			{stats && (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>
						Type:{" "}
						<span className="font-medium text-foreground">
							{stats.rootType}
						</span>
					</span>
					<span>
						{stats.rootType === "array" ? "Items" : "Keys"}:{" "}
						<span className="font-medium text-foreground">
							{stats.topLevelEntries}
						</span>
					</span>
					<span>
						Depth:{" "}
						<span className="font-medium text-foreground">
							{stats.maxDepth}
						</span>
					</span>
					<span>
						Size:{" "}
						<span className="font-medium text-foreground">
							{formatFileSize(stats.sizeBytes)}
						</span>
					</span>
				</div>
			)}
		</div>
	);
}
