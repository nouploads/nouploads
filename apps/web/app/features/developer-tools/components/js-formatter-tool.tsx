import {
	Check,
	ClipboardCopy,
	Download,
	FileUp,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import {
	BRACE_STYLE_OPTIONS,
	type BraceStyle,
	computeJsStats,
	formatJs,
	INDENT_SIZE_OPTIONS,
	type JsStats,
	MAX_JS_SIZE,
	validateJs,
} from "../processors/js-formatter";

const PLACEHOLDER_JS = `function greet(name){const msg="Hello, "+name+"!";console.log(msg);return msg;}
const users=[{id:1,name:"Alice"},{id:2,name:"Bob"}];
users.forEach(u=>greet(u.name));`;

type IndentOption = (typeof INDENT_SIZE_OPTIONS)[number]["value"];

function resolveIndent(value: IndentOption): {
	indentSize: number;
	indentChar: "space" | "tab";
} {
	if (value === "tab") return { indentSize: 1, indentChar: "tab" };
	return { indentSize: Number(value), indentChar: "space" };
}

export default function JsFormatterTool() {
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState<IndentOption>("2");
	const [braceStyle, setBraceStyle] = useState<BraceStyle>("collapse");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const [stats, setStats] = useState<JsStats | null>(null);
	const [isFormatting, setIsFormatting] = useState(false);
	const [copied, setCopied] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Cheap validation on every input change (no library load)
	useEffect(() => {
		if (!input.trim()) {
			setIsValid(null);
			setValidationError(null);
			setStats(null);
			return;
		}

		const result = validateJs(input);
		setIsValid(result.valid);
		setValidationError(result.error ?? null);
		setStats(computeJsStats(input));
	}, [input]);

	const handleFormat = useCallback(async () => {
		if (!input.trim() || isFormatting) return;
		setIsFormatting(true);
		try {
			const { indentSize, indentChar } = resolveIndent(indent);
			const formatted = await formatJs(input, {
				indentSize,
				indentChar,
				braceStyle,
			});
			setInput(formatted);
			setValidationError(null);
			setIsValid(true);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Format failed";
			setValidationError(msg);
			setIsValid(false);
		} finally {
			setIsFormatting(false);
		}
	}, [input, indent, braceStyle, isFormatting]);

	const handleCopy = useCallback(async () => {
		if (!input) return;
		try {
			await navigator.clipboard.writeText(input);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard may be blocked in some environments
		}
	}, [input]);

	const handleDownload = useCallback(() => {
		if (!input.trim()) return;
		const blob = new Blob([input], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "formatted.js";
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

			if (file.size > MAX_JS_SIZE) {
				setValidationError(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_JS_SIZE)}.`,
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

			e.target.value = "";
		},
		[],
	);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file) return;

		if (file.size > MAX_JS_SIZE) {
			setValidationError(
				`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_JS_SIZE)}.`,
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

	const indentLabel =
		INDENT_SIZE_OPTIONS.find((o) => o.value === indent)?.label ?? indent;
	const braceLabel =
		BRACE_STYLE_OPTIONS.find((o) => o.value === braceStyle)?.label ??
		braceStyle;

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					onClick={handleFormat}
					disabled={!input.trim() || isFormatting}
					className="gap-1.5"
				>
					<Sparkles className="size-3.5" />
					{isFormatting ? "Formatting..." : "Format"}
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
						accept=".js,.mjs,.cjs,application/javascript,text/javascript"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload JavaScript file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload .js
					</Button>
				</div>
			</div>

			{/* Options */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex items-center gap-2">
					<label htmlFor="js-indent" className="text-sm text-muted-foreground">
						Indent:
					</label>
					<Select
						value={indent}
						onValueChange={(v) => setIndent(v as IndentOption)}
					>
						<SelectTrigger
							id="js-indent"
							aria-label="Indent size"
							className="w-[140px]"
						>
							<SelectValue>{indentLabel}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{INDENT_SIZE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<label
						htmlFor="js-brace-style"
						className="text-sm text-muted-foreground"
					>
						Braces:
					</label>
					<Select
						value={braceStyle}
						onValueChange={(v) => setBraceStyle(v as BraceStyle)}
					>
						<SelectTrigger
							id="js-brace-style"
							aria-label="Brace style"
							className="w-[140px]"
						>
							<SelectValue>{braceLabel}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{BRACE_STYLE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Validation status */}
			{isValid !== null && (
				<div className="flex flex-wrap items-center gap-2">
					{isValid ? (
						<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
							<Check className="size-3" />
							Looks OK
						</Badge>
					) : (
						<Badge variant="destructive" className="gap-1">
							<X className="size-3" />
							Invalid JavaScript
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
				placeholder={PLACEHOLDER_JS}
				className="min-h-[400px] font-mono text-sm leading-relaxed resize-y"
				spellCheck={false}
				aria-label="JavaScript input"
			/>

			{/* Statistics */}
			{stats && (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>
						Lines:{" "}
						<span className="font-medium text-foreground">{stats.lines}</span>
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
