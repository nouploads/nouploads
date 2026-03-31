import {
	ArrowLeftRight,
	Check,
	ClipboardCopy,
	Download,
	FileUp,
	Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { csvToJson, jsonToCsv, MAX_INPUT_SIZE } from "../processors/json-csv";

const PLACEHOLDER_JSON = `[
  { "name": "Alice", "age": 30, "city": "New York" },
  { "name": "Bob", "age": 25, "city": "London" }
]`;

const PLACEHOLDER_CSV = `name,age,city
Alice,30,New York
Bob,25,London`;

type Direction = "json-to-csv" | "csv-to-json";
type Delimiter = "," | "\t" | ";";

const DELIMITER_LABELS: Record<Delimiter, string> = {
	",": "Comma",
	"\t": "Tab",
	";": "Semicolon",
};

export default function JsonCsvTool() {
	const [direction, setDirection] = useState<Direction>("json-to-csv");
	const [delimiter, setDelimiter] = useState<Delimiter>(",");
	const [flatten, setFlatten] = useState(true);
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [rowCount, setRowCount] = useState<number | null>(null);
	const [colCount, setColCount] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const isJsonMode = direction === "json-to-csv";

	const handleConvert = useCallback(() => {
		if (!input.trim()) {
			setError("Please enter some input.");
			setOutput("");
			setRowCount(null);
			setColCount(null);
			return;
		}

		try {
			let result: string;
			if (isJsonMode) {
				result = jsonToCsv(input, { delimiter, flatten });
			} else {
				result = csvToJson(input, { delimiter });
			}
			setOutput(result);
			setError(null);

			// Compute stats
			if (isJsonMode && result) {
				const lines = result.split("\n");
				setColCount(lines[0] ? lines[0].split(delimiter).length : 0);
				setRowCount(Math.max(0, lines.length - 1)); // subtract header
			} else if (!isJsonMode && result) {
				try {
					const parsed = JSON.parse(result);
					if (Array.isArray(parsed)) {
						setRowCount(parsed.length);
						setColCount(parsed.length > 0 ? Object.keys(parsed[0]).length : 0);
					}
				} catch {
					setRowCount(null);
					setColCount(null);
				}
			} else {
				setRowCount(null);
				setColCount(null);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Conversion failed.");
			setOutput("");
			setRowCount(null);
			setColCount(null);
		}
	}, [input, isJsonMode, delimiter, flatten]);

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
		const ext = isJsonMode ? ".csv" : ".json";
		const mime = isJsonMode ? "text/csv" : "application/json";
		const blob = new Blob([output], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `converted${ext}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [output, isJsonMode]);

	const handleClear = useCallback(() => {
		setInput("");
		setOutput("");
		setError(null);
		setRowCount(null);
		setColCount(null);
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_INPUT_SIZE) {
				setError(
					`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
				);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				setInput(text);
				setError(null);
				setOutput("");
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

		if (file.size > MAX_INPUT_SIZE) {
			setError(
				`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
			);
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			setInput(text);
			setError(null);
			setOutput("");
		};
		reader.readAsText(file);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const switchDirection = useCallback(() => {
		const next: Direction =
			direction === "json-to-csv" ? "csv-to-json" : "json-to-csv";
		setDirection(next);
		setInput("");
		setOutput("");
		setError(null);
		setRowCount(null);
		setColCount(null);
	}, [direction]);

	return (
		<div className="space-y-4">
			{/* Direction tabs + controls */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex rounded-md border bg-muted p-0.5">
					<button
						type="button"
						onClick={() => {
							if (direction !== "json-to-csv") switchDirection();
						}}
						className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
							isJsonMode
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						JSON → CSV
					</button>
					<button
						type="button"
						onClick={() => {
							if (direction !== "csv-to-json") switchDirection();
						}}
						className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
							!isJsonMode
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						CSV → JSON
					</button>
				</div>

				<select
					value={delimiter}
					onChange={(e) => setDelimiter(e.target.value as Delimiter)}
					className="rounded-md border bg-background px-2 py-1.5 text-sm"
					aria-label="Delimiter"
				>
					{Object.entries(DELIMITER_LABELS).map(([val, label]) => (
						<option key={val} value={val}>
							{label}
						</option>
					))}
				</select>

				{isJsonMode && (
					<label className="flex items-center gap-1.5 text-sm">
						<input
							type="checkbox"
							checked={flatten}
							onChange={(e) => setFlatten(e.target.checked)}
							className="rounded border-muted-foreground/50"
						/>
						Flatten nested
					</label>
				)}

				<div className="ml-auto">
					<input
						ref={fileInputRef}
						type="file"
						accept={
							isJsonMode ? ".json,application/json" : ".csv,text/csv,.tsv"
						}
						onChange={handleFileUpload}
						className="hidden"
						aria-label={isJsonMode ? "Upload JSON file" : "Upload CSV file"}
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload {isJsonMode ? ".json" : ".csv"}
					</Button>
				</div>
			</div>

			{/* Input area */}
			<div>
				<label
					htmlFor="json-csv-input"
					className="mb-1.5 block text-sm font-medium"
				>
					{isJsonMode ? "JSON Input" : "CSV Input"}
				</label>
				<Textarea
					id="json-csv-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					placeholder={isJsonMode ? PLACEHOLDER_JSON : PLACEHOLDER_CSV}
					className="min-h-[200px] font-mono text-sm leading-relaxed resize-y"
					spellCheck={false}
					aria-label={isJsonMode ? "JSON input" : "CSV input"}
				/>
			</div>

			{/* Action buttons */}
			<div className="flex flex-wrap items-center gap-2">
				<Button size="sm" onClick={handleConvert} className="gap-1.5">
					<ArrowLeftRight className="size-3.5" />
					Convert
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
					Download {isJsonMode ? ".csv" : ".json"}
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleClear}
					disabled={!input && !output}
					className="gap-1.5"
				>
					<Trash2 className="size-3.5" />
					Clear
				</Button>
			</div>

			{/* Error */}
			{error && (
				<Badge variant="destructive" className="gap-1">
					{error}
				</Badge>
			)}

			{/* Output area */}
			{output && (
				<div>
					<label
						htmlFor="json-csv-output"
						className="mb-1.5 block text-sm font-medium"
					>
						{isJsonMode ? "CSV Output" : "JSON Output"}
					</label>
					<Textarea
						id="json-csv-output"
						value={output}
						readOnly
						className="min-h-[200px] font-mono text-sm leading-relaxed resize-y"
						spellCheck={false}
						aria-label={isJsonMode ? "CSV output" : "JSON output"}
					/>
				</div>
			)}

			{/* Stats */}
			{rowCount !== null && colCount !== null && (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>
						Rows:{" "}
						<span className="font-medium text-foreground">{rowCount}</span>
					</span>
					<span>
						Columns:{" "}
						<span className="font-medium text-foreground">{colCount}</span>
					</span>
				</div>
			)}
		</div>
	);
}
