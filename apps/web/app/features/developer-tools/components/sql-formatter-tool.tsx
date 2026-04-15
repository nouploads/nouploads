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
	computeSqlStats,
	formatSql,
	type KeywordCase,
	MAX_SQL_SIZE,
	minifySql,
	type SqlDialect,
	type SqlStats,
	SUPPORTED_DIALECTS,
	validateSql,
} from "../processors/sql-formatter";

const PLACEHOLDER_SQL = `select u.id, u.email, count(o.id) as order_count
from users u
left join orders o on o.user_id = u.id
where u.created_at > '2024-01-01'
group by u.id, u.email
order by order_count desc
limit 10;`;

const KEYWORD_CASE_LABELS: Record<KeywordCase, string> = {
	upper: "UPPERCASE",
	lower: "lowercase",
	preserve: "Preserve",
};

export default function SqlFormatterTool() {
	const [input, setInput] = useState("");
	const [dialect, setDialect] = useState<SqlDialect>("sql");
	const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isValid, setIsValid] = useState<boolean | null>(null);
	const [stats, setStats] = useState<SqlStats | null>(null);
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

		const result = validateSql(input);
		setIsValid(result.valid);
		setValidationError(result.error ?? null);
		setStats(computeSqlStats(input));
	}, [input]);

	const handleFormat = useCallback(async () => {
		if (!input.trim() || isFormatting) return;
		setIsFormatting(true);
		try {
			const formatted = await formatSql(input, { dialect, keywordCase });
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
	}, [input, dialect, keywordCase, isFormatting]);

	const handleMinify = useCallback(() => {
		if (!input.trim()) return;
		const minified = minifySql(input);
		setInput(minified);
	}, [input]);

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
		const blob = new Blob([input], { type: "application/sql" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "formatted.sql";
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

			if (file.size > MAX_SQL_SIZE) {
				setValidationError(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_SQL_SIZE)}.`,
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

		if (file.size > MAX_SQL_SIZE) {
			setValidationError(
				`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_SQL_SIZE)}.`,
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
					disabled={!input.trim() || isFormatting}
					className="gap-1.5"
				>
					<Sparkles className="size-3.5" />
					{isFormatting ? "Formatting..." : "Format"}
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={handleMinify}
					disabled={!input.trim()}
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
						accept=".sql,text/plain"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload SQL file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload .sql
					</Button>
				</div>
			</div>

			{/* Options */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex items-center gap-2">
					<label
						htmlFor="sql-dialect"
						className="text-sm text-muted-foreground"
					>
						Dialect:
					</label>
					<Select
						value={dialect}
						onValueChange={(v) => setDialect(v as SqlDialect)}
					>
						<SelectTrigger
							id="sql-dialect"
							aria-label="SQL dialect"
							className="w-[180px]"
						>
							<SelectValue>
								{SUPPORTED_DIALECTS.find((d) => d.value === dialect)?.label}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{SUPPORTED_DIALECTS.map((d) => (
								<SelectItem key={d.value} value={d.value}>
									{d.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<label
						htmlFor="sql-keyword-case"
						className="text-sm text-muted-foreground"
					>
						Keywords:
					</label>
					<Select
						value={keywordCase}
						onValueChange={(v) => setKeywordCase(v as KeywordCase)}
					>
						<SelectTrigger
							id="sql-keyword-case"
							aria-label="Keyword case"
							className="w-[140px]"
						>
							<SelectValue>{KEYWORD_CASE_LABELS[keywordCase]}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="upper">UPPERCASE</SelectItem>
							<SelectItem value="lower">lowercase</SelectItem>
							<SelectItem value="preserve">Preserve</SelectItem>
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
							Invalid SQL
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
				placeholder={PLACEHOLDER_SQL}
				className="min-h-[400px] font-mono text-sm leading-relaxed resize-y"
				spellCheck={false}
				aria-label="SQL input"
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
