import {
	AlertCircle,
	Check,
	CheckCircle2,
	Copy,
	Download,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	generateBulk,
	generateUuidV4,
	generateUuidV7,
	type UuidValidation,
	validateUuid,
} from "../processors/uuid-generator";

// ─── Copy button ──────────────────────────────────────────────

function CopyButton({
	text,
	label = "Copy",
}: {
	text: string;
	label?: string;
}) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setCopied(false), 2000);
	}, [text]);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleCopy}
			className="h-7 w-7 p-0 shrink-0"
			aria-label={copied ? "Copied" : label}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5 text-green-500" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
		</Button>
	);
}

// ─── Generate tab ─────────────────────────────────────────────

function GenerateTab() {
	const [version, setVersion] = useState<"v4" | "v7">("v4");
	const [singleUuid, setSingleUuid] = useState("");
	const [bulkCount, setBulkCount] = useState(10);
	const [bulkUuids, setBulkUuids] = useState<string[]>([]);

	// Generate initial UUID on mount
	useEffect(() => {
		setSingleUuid(generateUuidV4());
	}, []);

	const handleGenerate = useCallback(() => {
		const uuid = version === "v7" ? generateUuidV7() : generateUuidV4();
		setSingleUuid(uuid);
	}, [version]);

	const handleVersionChange = useCallback((v: "v4" | "v7") => {
		setVersion(v);
		const uuid = v === "v7" ? generateUuidV7() : generateUuidV4();
		setSingleUuid(uuid);
		setBulkUuids([]);
	}, []);

	const handleBulkGenerate = useCallback(() => {
		const uuids = generateBulk(version, bulkCount);
		setBulkUuids(uuids);
	}, [version, bulkCount]);

	const handleCopyAll = useCallback(async () => {
		await navigator.clipboard.writeText(bulkUuids.join("\n"));
	}, [bulkUuids]);

	const handleDownload = useCallback(() => {
		const text = bulkUuids.join("\n");
		const blob = new Blob([text], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `uuids-${version}-${bulkUuids.length}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [bulkUuids, version]);

	return (
		<div className="space-y-6">
			{/* Version toggle */}
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium">Version:</span>
				<div className="flex rounded-lg border overflow-hidden">
					<button
						type="button"
						onClick={() => handleVersionChange("v4")}
						className={`px-3 py-1.5 text-sm font-medium transition-colors ${
							version === "v4"
								? "bg-primary text-primary-foreground"
								: "hover:bg-muted"
						}`}
					>
						v4 (Random)
					</button>
					<button
						type="button"
						onClick={() => handleVersionChange("v7")}
						className={`px-3 py-1.5 text-sm font-medium transition-colors ${
							version === "v7"
								? "bg-primary text-primary-foreground"
								: "hover:bg-muted"
						}`}
					>
						v7 (Timestamp)
					</button>
				</div>
			</div>

			{/* Single UUID */}
			<div className="space-y-3">
				<div className="flex items-center gap-2 rounded-lg border p-4">
					<span className="font-mono text-base break-all flex-1 min-w-0 select-all">
						{singleUuid}
					</span>
					<CopyButton text={singleUuid} label="Copy UUID" />
				</div>
				<Button onClick={handleGenerate} className="gap-1.5">
					<RefreshCw className="h-3.5 w-3.5" />
					Generate
				</Button>
			</div>

			{/* Bulk generation */}
			<div className="space-y-3 border-t pt-6">
				<h2 className="text-sm font-medium">Bulk Generation</h2>
				<div className="flex items-center gap-3">
					<label htmlFor="bulk-count" className="text-sm text-muted-foreground">
						Count:
					</label>
					<Input
						id="bulk-count"
						type="number"
						min={1}
						max={1000}
						value={bulkCount}
						onChange={(e) =>
							setBulkCount(
								Math.min(
									1000,
									Math.max(1, Number.parseInt(e.target.value, 10) || 1),
								),
							)
						}
						className="w-24"
					/>
					<Button
						onClick={handleBulkGenerate}
						variant="outline"
						className="gap-1.5"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						Generate Bulk
					</Button>
				</div>

				{bulkUuids.length > 0 && (
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyAll}
								className="gap-1.5"
							>
								<Copy className="h-3.5 w-3.5" />
								Copy All
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleDownload}
								className="gap-1.5"
							>
								<Download className="h-3.5 w-3.5" />
								Download .txt
							</Button>
							<span className="text-xs text-muted-foreground">
								{bulkUuids.length} UUIDs
							</span>
						</div>
						<div className="rounded-lg border max-h-80 overflow-y-auto divide-y">
							{bulkUuids.map((uuid, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: generated list with no reordering
									key={i}
									className="flex items-center gap-2 px-3 py-1.5"
								>
									<span className="text-xs text-muted-foreground w-8 shrink-0 tabular-nums">
										{i + 1}
									</span>
									<span className="font-mono text-xs break-all flex-1 min-w-0 select-all">
										{uuid}
									</span>
									<CopyButton text={uuid} label={`Copy UUID ${i + 1}`} />
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Validate tab ─────────────────────────────────────────────

function ValidateTab() {
	const [input, setInput] = useState("");
	const [result, setResult] = useState<UuidValidation | null>(null);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInput(value);
		if (value.trim()) {
			setResult(validateUuid(value));
		} else {
			setResult(null);
		}
	}, []);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="validate-input" className="text-sm font-medium">
					Paste a UUID to validate
				</label>
				<Input
					id="validate-input"
					placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
					value={input}
					onChange={handleChange}
					className="font-mono"
				/>
			</div>

			{result && (
				<div className="rounded-lg border divide-y">
					{/* Valid / Invalid */}
					<div className="flex items-center gap-3 px-4 py-3">
						<span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
							Status
						</span>
						<div className="flex-1">
							{result.valid ? (
								<Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-0">
									<CheckCircle2 className="h-3 w-3" />
									Valid UUID
								</Badge>
							) : (
								<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0">
									<XCircle className="h-3 w-3" />
									Invalid UUID
								</Badge>
							)}
						</div>
					</div>

					{result.valid && (
						<>
							{/* Version */}
							<div className="flex items-center gap-3 px-4 py-3">
								<span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
									Version
								</span>
								<span className="text-sm">{result.version}</span>
							</div>

							{/* Variant */}
							<div className="flex items-center gap-3 px-4 py-3">
								<span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
									Variant
								</span>
								<span className="text-sm">{result.variant}</span>
							</div>

							{/* Timestamp (v7 only) */}
							{result.timestamp && (
								<div className="flex items-center gap-3 px-4 py-3">
									<span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
										Timestamp
									</span>
									<span className="text-sm font-mono">
										{result.timestamp.toISOString()}
									</span>
								</div>
							)}
						</>
					)}

					{!result.valid && (
						<div className="flex items-start gap-3 px-4 py-3">
							<AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
							<p className="text-sm text-muted-foreground">
								The input does not match the UUID format. A valid UUID has the
								form{" "}
								<code className="text-xs bg-muted px-1 py-0.5 rounded">
									xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
								</code>{" "}
								where M is the version and N indicates the variant.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────

export default function UuidGeneratorTool() {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="generate">
				<TabsList>
					<TabsTrigger value="generate" className="gap-1.5">
						<RefreshCw className="h-3.5 w-3.5" />
						Generate
					</TabsTrigger>
					<TabsTrigger value="validate" className="gap-1.5">
						<CheckCircle2 className="h-3.5 w-3.5" />
						Validate
					</TabsTrigger>
				</TabsList>
				<TabsContent value="generate">
					<GenerateTab />
				</TabsContent>
				<TabsContent value="validate">
					<ValidateTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
