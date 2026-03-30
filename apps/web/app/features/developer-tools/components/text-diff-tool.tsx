import { Columns2, FileUp, Rows2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import {
	computeDiff,
	type DiffLine,
	type DiffResult,
	LARGE_INPUT_THRESHOLD,
	MAX_TEXT_SIZE,
} from "../processors/text-diff";

type ViewMode = "unified" | "side-by-side";

export default function TextDiffTool() {
	const [left, setLeft] = useState("");
	const [right, setRight] = useState("");
	const [result, setResult] = useState<DiffResult | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>("unified");
	const [warning, setWarning] = useState<string | null>(null);
	const leftFileRef = useRef<HTMLInputElement>(null);
	const rightFileRef = useRef<HTMLInputElement>(null);

	// Auto-compare with debounce
	useEffect(() => {
		setWarning(null);

		if (!left && !right) {
			setResult(null);
			return;
		}

		const leftLineCount = left.split("\n").length;
		const rightLineCount = right.split("\n").length;

		if (
			leftLineCount > LARGE_INPUT_THRESHOLD ||
			rightLineCount > LARGE_INPUT_THRESHOLD
		) {
			setWarning(
				`Large input detected (${Math.max(leftLineCount, rightLineCount).toLocaleString()} lines). Diff may be slow.`,
			);
		}

		const timer = setTimeout(() => {
			const diff = computeDiff(left, right);
			setResult(diff);
		}, 300);

		return () => clearTimeout(timer);
	}, [left, right]);

	const handleFileUpload = useCallback(
		(side: "left" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_TEXT_SIZE) {
				setWarning(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_TEXT_SIZE)}.`,
				);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				if (side === "left") setLeft(text);
				else setRight(text);
			};
			reader.readAsText(file);

			e.target.value = "";
		},
		[],
	);

	const handleClear = useCallback(() => {
		setLeft("");
		setRight("");
		setResult(null);
		setWarning(null);
	}, []);

	const hasInput = left.length > 0 || right.length > 0;

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant={viewMode === "unified" ? "default" : "secondary"}
					onClick={() => setViewMode("unified")}
					className="gap-1.5"
				>
					<Rows2 className="size-3.5" />
					Unified
				</Button>
				<Button
					size="sm"
					variant={viewMode === "side-by-side" ? "default" : "secondary"}
					onClick={() => setViewMode("side-by-side")}
					className="gap-1.5"
				>
					<Columns2 className="size-3.5" />
					Side by Side
				</Button>
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
			</div>

			{/* Text inputs */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<label htmlFor="diff-left" className="text-sm font-medium">
							Original
						</label>
						<div>
							<input
								ref={leftFileRef}
								type="file"
								accept=".txt,.text,text/plain,.csv,.json,.xml,.html,.css,.js,.ts,.md,.yml,.yaml,.log,.cfg,.ini,.env,.sh,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.hpp"
								onChange={(e) => handleFileUpload("left", e)}
								className="hidden"
								aria-label="Upload original file"
							/>
							<Button
								size="xs"
								variant="outline"
								onClick={() => leftFileRef.current?.click()}
								className="gap-1"
							>
								<FileUp className="size-3" />
								Upload
							</Button>
						</div>
					</div>
					<Textarea
						id="diff-left"
						value={left}
						onChange={(e) => setLeft(e.target.value)}
						placeholder="Paste original text here..."
						className="min-h-[200px] font-mono text-xs resize-y"
						spellCheck={false}
					/>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<label htmlFor="diff-right" className="text-sm font-medium">
							Modified
						</label>
						<div>
							<input
								ref={rightFileRef}
								type="file"
								accept=".txt,.text,text/plain,.csv,.json,.xml,.html,.css,.js,.ts,.md,.yml,.yaml,.log,.cfg,.ini,.env,.sh,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.hpp"
								onChange={(e) => handleFileUpload("right", e)}
								className="hidden"
								aria-label="Upload modified file"
							/>
							<Button
								size="xs"
								variant="outline"
								onClick={() => rightFileRef.current?.click()}
								className="gap-1"
							>
								<FileUp className="size-3" />
								Upload
							</Button>
						</div>
					</div>
					<Textarea
						id="diff-right"
						value={right}
						onChange={(e) => setRight(e.target.value)}
						placeholder="Paste modified text here..."
						className="min-h-[200px] font-mono text-xs resize-y"
						spellCheck={false}
					/>
				</div>
			</div>

			{/* Warning */}
			{warning && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
					{warning}
				</div>
			)}

			{/* Results */}
			{result && (
				<div className="space-y-3">
					{/* Stats */}
					<div className="flex flex-wrap items-center gap-2">
						{result.identical ? (
							<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
								No differences found
							</Badge>
						) : (
							<>
								{result.stats.added > 0 && (
									<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
										+{result.stats.added} added
									</Badge>
								)}
								{result.stats.removed > 0 && (
									<Badge variant="destructive">
										-{result.stats.removed} removed
									</Badge>
								)}
								<span className="text-xs text-muted-foreground">
									{result.stats.unchanged} unchanged
								</span>
							</>
						)}
					</div>

					{/* Diff output */}
					{!result.identical && (
						<div className="rounded-lg border overflow-hidden">
							{viewMode === "unified" ? (
								<UnifiedView lines={result.lines} />
							) : (
								<SideBySideView lines={result.lines} />
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Unified diff view ──────────────────────────────────────

function UnifiedView({ lines }: { lines: DiffLine[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full border-collapse font-mono text-xs">
				<tbody>
					{lines.map((line, i) => (
						<tr
							// biome-ignore lint/suspicious/noArrayIndexKey: diff lines are stable during a single render
							key={i}
							className={
								line.type === "added"
									? "bg-green-50 dark:bg-green-950/30"
									: line.type === "removed"
										? "bg-red-50 dark:bg-red-950/30"
										: ""
							}
						>
							<td className="w-10 select-none px-2 py-0.5 text-right text-muted-foreground/50 border-r">
								{line.leftLineNum ?? ""}
							</td>
							<td className="w-10 select-none px-2 py-0.5 text-right text-muted-foreground/50 border-r">
								{line.rightLineNum ?? ""}
							</td>
							<td className="w-6 select-none px-1 py-0.5 text-center">
								{line.type === "added" ? (
									<span className="text-green-600 dark:text-green-400">+</span>
								) : line.type === "removed" ? (
									<span className="text-red-600 dark:text-red-400">-</span>
								) : (
									<span className="text-muted-foreground/30"> </span>
								)}
							</td>
							<td className="px-2 py-0.5 whitespace-pre-wrap break-all">
								{line.content}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ─── Side-by-side diff view ─────────────────────────────────

function SideBySideView({ lines }: { lines: DiffLine[] }) {
	// Build left and right columns
	const leftCol: Array<{
		lineNum?: number;
		content: string;
		type: "equal" | "removed" | "empty";
	}> = [];
	const rightCol: Array<{
		lineNum?: number;
		content: string;
		type: "equal" | "added" | "empty";
	}> = [];

	for (const line of lines) {
		if (line.type === "equal") {
			leftCol.push({
				lineNum: line.leftLineNum,
				content: line.content,
				type: "equal",
			});
			rightCol.push({
				lineNum: line.rightLineNum,
				content: line.content,
				type: "equal",
			});
		} else if (line.type === "removed") {
			leftCol.push({
				lineNum: line.leftLineNum,
				content: line.content,
				type: "removed",
			});
			rightCol.push({
				content: "",
				type: "empty",
			});
		} else {
			leftCol.push({
				content: "",
				type: "empty",
			});
			rightCol.push({
				lineNum: line.rightLineNum,
				content: line.content,
				type: "added",
			});
		}
	}

	const rowBg = (type: "equal" | "removed" | "added" | "empty") => {
		if (type === "added") return "bg-green-50 dark:bg-green-950/30";
		if (type === "removed") return "bg-red-50 dark:bg-red-950/30";
		if (type === "empty") return "bg-muted/30";
		return "";
	};

	return (
		<div className="grid grid-cols-2 divide-x overflow-x-auto">
			{/* Left */}
			<div>
				<table className="w-full border-collapse font-mono text-xs">
					<tbody>
						{leftCol.map((row, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: diff rows are stable during a single render
							<tr key={i} className={rowBg(row.type)}>
								<td className="w-10 select-none px-2 py-0.5 text-right text-muted-foreground/50 border-r">
									{row.lineNum ?? ""}
								</td>
								<td className="px-2 py-0.5 whitespace-pre-wrap break-all">
									{row.content}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{/* Right */}
			<div>
				<table className="w-full border-collapse font-mono text-xs">
					<tbody>
						{rightCol.map((row, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: diff rows are stable during a single render
							<tr key={i} className={rowBg(row.type)}>
								<td className="w-10 select-none px-2 py-0.5 text-right text-muted-foreground/50 border-r">
									{row.lineNum ?? ""}
								</td>
								<td className="px-2 py-0.5 whitespace-pre-wrap break-all">
									{row.content}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
