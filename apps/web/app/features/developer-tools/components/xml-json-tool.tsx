import {
	ArrowRightLeft,
	Check,
	ClipboardCopy,
	Download,
	FileUp,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import {
	detectFormat,
	jsonToXml,
	MAX_INPUT_SIZE,
	validateJson,
	validateXml,
	xmlToJson,
} from "../processors/xml-json";

type Direction = "xml-to-json" | "json-to-xml";

const PLACEHOLDER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <user id="1" role="admin">
    <name>Alice</name>
    <age>30</age>
  </user>
  <user id="2" role="member">
    <name>Bob</name>
    <age>25</age>
  </user>
</root>`;

const PLACEHOLDER_JSON = `{
  "root": {
    "user": [
      {
        "@_id": "1",
        "@_role": "admin",
        "name": "Alice",
        "age": 30
      },
      {
        "@_id": "2",
        "@_role": "member",
        "name": "Bob",
        "age": 25
      }
    ]
  }
}`;

export default function XmlJsonTool() {
	const [xmlInput, setXmlInput] = useState("");
	const [jsonInput, setJsonInput] = useState("");
	const [direction, setDirection] = useState<Direction>("xml-to-json");
	const [error, setError] = useState<string | null>(null);
	const [indent, setIndent] = useState(2);
	const [copied, setCopied] = useState<"xml" | "json" | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Convert XML -> JSON
	useEffect(() => {
		if (direction !== "xml-to-json") return;
		setError(null);
		if (!xmlInput.trim()) {
			setJsonInput("");
			return;
		}
		const result = xmlToJson(xmlInput, indent);
		if (result.error) {
			setError(result.error);
			setJsonInput("");
		} else {
			setJsonInput(result.output);
		}
	}, [xmlInput, direction, indent]);

	// Convert JSON -> XML
	useEffect(() => {
		if (direction !== "json-to-xml") return;
		setError(null);
		if (!jsonInput.trim()) {
			setXmlInput("");
			return;
		}
		const result = jsonToXml(jsonInput, indent);
		if (result.error) {
			setError(result.error);
			setXmlInput("");
		} else {
			setXmlInput(result.output);
		}
	}, [jsonInput, direction, indent]);

	const handleSwapDirection = useCallback(() => {
		setError(null);
		setDirection((prev) =>
			prev === "xml-to-json" ? "json-to-xml" : "xml-to-json",
		);
	}, []);

	const handleCopy = useCallback(
		async (side: "xml" | "json") => {
			const text = side === "xml" ? xmlInput : jsonInput;
			if (!text) return;
			try {
				await navigator.clipboard.writeText(text);
				setCopied(side);
				setTimeout(() => setCopied(null), 2000);
			} catch {
				// clipboard may be blocked
			}
		},
		[xmlInput, jsonInput],
	);

	const handleDownload = useCallback(
		(side: "xml" | "json") => {
			const text = side === "xml" ? xmlInput : jsonInput;
			if (!text) return;
			const ext = side === "xml" ? "xml" : "json";
			const mime = side === "xml" ? "application/xml" : "application/json";
			const blob = new Blob([text], { type: mime });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `converted.${ext}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		},
		[xmlInput, jsonInput],
	);

	const handleClear = useCallback(() => {
		setXmlInput("");
		setJsonInput("");
		setError(null);
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_INPUT_SIZE) {
				setError(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_INPUT_SIZE)}.`,
				);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				const format = detectFormat(text);

				if (format === "json") {
					setDirection("json-to-xml");
					setJsonInput(text);
				} else {
					setDirection("xml-to-json");
					setXmlInput(text);
				}
			};
			reader.readAsText(file);

			e.target.value = "";
		},
		[],
	);

	const sourceIsXml = direction === "xml-to-json";
	const sourceText = sourceIsXml ? xmlInput : jsonInput;
	const hasInput = xmlInput.trim().length > 0 || jsonInput.trim().length > 0;

	const xmlValidation = xmlInput.trim() ? validateXml(xmlInput) : null;
	const jsonValidation = jsonInput.trim() ? validateJson(jsonInput) : null;

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					onClick={handleSwapDirection}
					className="gap-1.5"
					aria-label="Switch conversion direction"
				>
					<ArrowRightLeft className="size-3.5" />
					{sourceIsXml ? "XML \u2192 JSON" : "JSON \u2192 XML"}
				</Button>
				<div className="flex items-center gap-1.5">
					<label
						htmlFor="xml-indent-select"
						className="text-xs text-muted-foreground"
					>
						Indent:
					</label>
					<select
						id="xml-indent-select"
						value={indent}
						onChange={(e) => setIndent(Number(e.target.value))}
						className="h-8 rounded-md border bg-background px-2 text-xs"
					>
						<option value={2}>2 spaces</option>
						<option value={4}>4 spaces</option>
					</select>
				</div>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleClear}
					disabled={!hasInput}
					className="gap-1.5"
				>
					<Trash2 className="size-3.5" />
					Clear
				</Button>
				<div className="ml-auto">
					<input
						ref={fileInputRef}
						type="file"
						accept=".xml,.json,application/xml,text/xml,application/json"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload XML or JSON file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload file
					</Button>
				</div>
			</div>

			{/* Error */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
					{error}
				</div>
			)}

			{/* Two-panel editor */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* XML panel */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<label htmlFor="xml-input" className="text-sm font-medium">
								XML
							</label>
							{sourceIsXml && (
								<Badge variant="secondary" className="text-xs">
									Source
								</Badge>
							)}
							{xmlValidation &&
								xmlInput.trim() &&
								(xmlValidation.valid ? (
									<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
										Valid
									</Badge>
								) : (
									<>
										<Badge variant="destructive" className="text-xs">
											Invalid
										</Badge>
										{xmlValidation.error && (
											<span className="text-xs text-destructive">
												{xmlValidation.error}
											</span>
										)}
									</>
								))}
						</div>
						<div className="flex items-center gap-1">
							<Button
								size="xs"
								variant="ghost"
								onClick={() => handleCopy("xml")}
								disabled={!xmlInput.trim()}
								className="gap-1"
							>
								{copied === "xml" ? (
									<Check className="size-3" />
								) : (
									<ClipboardCopy className="size-3" />
								)}
								{copied === "xml" ? "Copied" : "Copy"}
							</Button>
							<Button
								size="xs"
								variant="ghost"
								onClick={() => handleDownload("xml")}
								disabled={!xmlInput.trim()}
								className="gap-1"
							>
								<Download className="size-3" />
								.xml
							</Button>
						</div>
					</div>
					<Textarea
						id="xml-input"
						value={xmlInput}
						onChange={(e) => {
							if (direction !== "xml-to-json") {
								setDirection("xml-to-json");
							}
							setXmlInput(e.target.value);
						}}
						placeholder={PLACEHOLDER_XML}
						className={`min-h-[350px] font-mono text-sm leading-relaxed resize-y ${!sourceIsXml && xmlInput.trim() ? "bg-muted/30" : ""}`}
						spellCheck={false}
						readOnly={!sourceIsXml}
						aria-label="XML input"
					/>
				</div>

				{/* JSON panel */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<label htmlFor="json-input" className="text-sm font-medium">
								JSON
							</label>
							{!sourceIsXml && (
								<Badge variant="secondary" className="text-xs">
									Source
								</Badge>
							)}
							{jsonValidation &&
								jsonInput.trim() &&
								(jsonValidation.valid ? (
									<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
										Valid
									</Badge>
								) : (
									<Badge variant="destructive" className="text-xs">
										Invalid
									</Badge>
								))}
						</div>
						<div className="flex items-center gap-1">
							<Button
								size="xs"
								variant="ghost"
								onClick={() => handleCopy("json")}
								disabled={!jsonInput.trim()}
								className="gap-1"
							>
								{copied === "json" ? (
									<Check className="size-3" />
								) : (
									<ClipboardCopy className="size-3" />
								)}
								{copied === "json" ? "Copied" : "Copy"}
							</Button>
							<Button
								size="xs"
								variant="ghost"
								onClick={() => handleDownload("json")}
								disabled={!jsonInput.trim()}
								className="gap-1"
							>
								<Download className="size-3" />
								.json
							</Button>
						</div>
					</div>
					<Textarea
						id="json-input"
						value={jsonInput}
						onChange={(e) => {
							if (direction !== "json-to-xml") {
								setDirection("json-to-xml");
							}
							setJsonInput(e.target.value);
						}}
						placeholder={PLACEHOLDER_JSON}
						className={`min-h-[350px] font-mono text-sm leading-relaxed resize-y ${sourceIsXml && jsonInput.trim() ? "bg-muted/30" : ""}`}
						spellCheck={false}
						readOnly={sourceIsXml}
						aria-label="JSON input"
					/>
				</div>
			</div>

			{/* Input stats */}
			{sourceText.trim() && (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>
						Input size:{" "}
						<span className="font-medium text-foreground">
							{formatFileSize(new TextEncoder().encode(sourceText).byteLength)}
						</span>
					</span>
					<span>
						Lines:{" "}
						<span className="font-medium text-foreground">
							{sourceText.split("\n").length}
						</span>
					</span>
				</div>
			)}
		</div>
	);
}
