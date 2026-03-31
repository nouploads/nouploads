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
	jsonToYaml,
	MAX_INPUT_SIZE,
	validateJson,
	validateYaml,
	yamlToJson,
} from "../processors/yaml-json";

type Direction = "yaml-to-json" | "json-to-yaml";

const PLACEHOLDER_YAML = `name: example
version: 1.0.0
tags:
  - yaml
  - converter
nested:
  key: value`;

const PLACEHOLDER_JSON = `{
  "name": "example",
  "version": "1.0.0",
  "tags": ["yaml", "converter"],
  "nested": {
    "key": "value"
  }
}`;

export default function YamlJsonTool() {
	const [yamlInput, setYamlInput] = useState("");
	const [jsonInput, setJsonInput] = useState("");
	const [direction, setDirection] = useState<Direction>("yaml-to-json");
	const [error, setError] = useState<string | null>(null);
	const [indent, setIndent] = useState(2);
	const [copied, setCopied] = useState<"yaml" | "json" | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Convert YAML -> JSON
	useEffect(() => {
		if (direction !== "yaml-to-json") return;
		setError(null);
		if (!yamlInput.trim()) {
			setJsonInput("");
			return;
		}
		const result = yamlToJson(yamlInput, indent);
		if (result.error) {
			setError(result.error);
			setJsonInput("");
		} else {
			setJsonInput(result.output);
		}
	}, [yamlInput, direction, indent]);

	// Convert JSON -> YAML
	useEffect(() => {
		if (direction !== "json-to-yaml") return;
		setError(null);
		if (!jsonInput.trim()) {
			setYamlInput("");
			return;
		}
		const result = jsonToYaml(jsonInput, indent);
		if (result.error) {
			setError(result.error);
			setYamlInput("");
		} else {
			setYamlInput(result.output);
		}
	}, [jsonInput, direction, indent]);

	const handleSwapDirection = useCallback(() => {
		setError(null);
		setDirection((prev) =>
			prev === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json",
		);
	}, []);

	const handleCopy = useCallback(
		async (side: "yaml" | "json") => {
			const text = side === "yaml" ? yamlInput : jsonInput;
			if (!text) return;
			try {
				await navigator.clipboard.writeText(text);
				setCopied(side);
				setTimeout(() => setCopied(null), 2000);
			} catch {
				// clipboard may be blocked
			}
		},
		[yamlInput, jsonInput],
	);

	const handleDownload = useCallback(
		(side: "yaml" | "json") => {
			const text = side === "yaml" ? yamlInput : jsonInput;
			if (!text) return;
			const ext = side === "yaml" ? "yaml" : "json";
			const mime = side === "yaml" ? "text/yaml" : "application/json";
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
		[yamlInput, jsonInput],
	);

	const handleClear = useCallback(() => {
		setYamlInput("");
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
					setDirection("json-to-yaml");
					setJsonInput(text);
				} else {
					setDirection("yaml-to-json");
					setYamlInput(text);
				}
			};
			reader.readAsText(file);

			e.target.value = "";
		},
		[],
	);

	const sourceIsYaml = direction === "yaml-to-json";
	const sourceText = sourceIsYaml ? yamlInput : jsonInput;
	const hasInput = yamlInput.trim().length > 0 || jsonInput.trim().length > 0;

	const yamlValidation = yamlInput.trim() ? validateYaml(yamlInput) : null;
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
					{sourceIsYaml ? "YAML \u2192 JSON" : "JSON \u2192 YAML"}
				</Button>
				<div className="flex items-center gap-1.5">
					<label
						htmlFor="indent-select"
						className="text-xs text-muted-foreground"
					>
						Indent:
					</label>
					<select
						id="indent-select"
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
						accept=".yaml,.yml,.json,text/yaml,application/json,application/x-yaml"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload YAML or JSON file"
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
				{/* YAML panel */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<label htmlFor="yaml-input" className="text-sm font-medium">
								YAML
							</label>
							{sourceIsYaml && (
								<Badge variant="secondary" className="text-xs">
									Source
								</Badge>
							)}
							{yamlValidation &&
								yamlInput.trim() &&
								(yamlValidation.valid ? (
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
								onClick={() => handleCopy("yaml")}
								disabled={!yamlInput.trim()}
								className="gap-1"
							>
								{copied === "yaml" ? (
									<Check className="size-3" />
								) : (
									<ClipboardCopy className="size-3" />
								)}
								{copied === "yaml" ? "Copied" : "Copy"}
							</Button>
							<Button
								size="xs"
								variant="ghost"
								onClick={() => handleDownload("yaml")}
								disabled={!yamlInput.trim()}
								className="gap-1"
							>
								<Download className="size-3" />
								.yaml
							</Button>
						</div>
					</div>
					<Textarea
						id="yaml-input"
						value={yamlInput}
						onChange={(e) => {
							if (direction !== "yaml-to-json") {
								setDirection("yaml-to-json");
							}
							setYamlInput(e.target.value);
						}}
						placeholder={PLACEHOLDER_YAML}
						className={`min-h-[350px] font-mono text-sm leading-relaxed resize-y ${!sourceIsYaml && yamlInput.trim() ? "bg-muted/30" : ""}`}
						spellCheck={false}
						readOnly={!sourceIsYaml}
						aria-label="YAML input"
					/>
				</div>

				{/* JSON panel */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<label htmlFor="json-input" className="text-sm font-medium">
								JSON
							</label>
							{!sourceIsYaml && (
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
							if (direction !== "json-to-yaml") {
								setDirection("json-to-yaml");
							}
							setJsonInput(e.target.value);
						}}
						placeholder={PLACEHOLDER_JSON}
						className={`min-h-[350px] font-mono text-sm leading-relaxed resize-y ${sourceIsYaml && jsonInput.trim() ? "bg-muted/30" : ""}`}
						spellCheck={false}
						readOnly={sourceIsYaml}
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
