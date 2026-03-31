import {
	AlertCircle,
	Check,
	ChevronDown,
	ChevronUp,
	Clock,
	Copy,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	describeCron,
	getNextRuns,
	parseCronExpression,
	validateCronExpression,
} from "../processors/cron-parser";

const PRESETS: { label: string; expr: string }[] = [
	{ label: "Every minute", expr: "* * * * *" },
	{ label: "Every hour", expr: "0 * * * *" },
	{ label: "Daily at midnight", expr: "0 0 * * *" },
	{ label: "Weekdays at 9am", expr: "0 9 * * 1-5" },
	{ label: "First of month", expr: "0 0 1 * *" },
];

const CHEAT_SHEET = [
	{
		field: "Minute",
		range: "0–59",
		examples: "0, */15, 5-30",
	},
	{
		field: "Hour",
		range: "0–23",
		examples: "0, 9, 1-5",
	},
	{
		field: "Day of Month",
		range: "1–31",
		examples: "1, 15, 1-7",
	},
	{
		field: "Month",
		range: "1–12",
		examples: "1, 6, 1-3",
	},
	{
		field: "Day of Week",
		range: "0–6 (0 = Sun)",
		examples: "0, 1-5, 0,6",
	},
];

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [text]);

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleCopy}
			className="h-7 w-7 p-0 shrink-0"
			aria-label={copied ? "Copied" : "Copy value"}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5 text-green-500" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
		</Button>
	);
}

function formatLocalTime(date: Date): string {
	return date.toLocaleString(undefined, {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
}

function formatUtcTime(date: Date): string {
	return date.toLocaleString(undefined, {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
		timeZone: "UTC",
	});
}

export default function CronParserTool() {
	const [input, setInput] = useState("");
	const [description, setDescription] = useState<string | null>(null);
	const [nextRuns, setNextRuns] = useState<Date[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [showCheatSheet, setShowCheatSheet] = useState(false);

	useEffect(() => {
		const trimmed = input.trim();
		if (!trimmed) {
			setDescription(null);
			setNextRuns([]);
			setError(null);
			return;
		}

		const validation = validateCronExpression(trimmed);
		if (!validation.valid) {
			setDescription(null);
			setNextRuns([]);
			setError(validation.error ?? "Invalid cron expression");
			return;
		}

		try {
			const p = parseCronExpression(trimmed);
			const desc = describeCron(p);
			const runs = getNextRuns(p, 10);
			setDescription(desc);
			setNextRuns(runs);
			setError(null);
		} catch (err) {
			setDescription(null);
			setNextRuns([]);
			setError(err instanceof Error ? err.message : "Parse error");
		}
	}, [input]);

	const handlePreset = useCallback((expr: string) => {
		setInput(expr);
	}, []);

	const fieldLabels = useMemo(() => {
		if (!input.trim()) return null;
		const parts = input.trim().split(/\s+/);
		if (parts.length !== 5) return null;
		return [
			{ label: "min", value: parts[0] },
			{ label: "hour", value: parts[1] },
			{ label: "day", value: parts[2] },
			{ label: "month", value: parts[3] },
			{ label: "dow", value: parts[4] },
		];
	}, [input]);

	return (
		<div className="space-y-6">
			{/* Input */}
			<div className="space-y-3">
				<label htmlFor="cron-input" className="text-sm font-medium">
					Cron Expression
				</label>
				<Input
					id="cron-input"
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="*/15 * * * *"
					className="font-mono text-sm"
					aria-label="Cron expression"
				/>

				{/* Field labels under input */}
				{fieldLabels && (
					<div className="flex gap-1 font-mono text-xs text-muted-foreground">
						{fieldLabels.map((f) => (
							<div
								key={f.label}
								className="flex flex-col items-center flex-1 min-w-0"
							>
								<span className="text-foreground font-medium truncate">
									{f.value}
								</span>
								<span>{f.label}</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Preset buttons */}
			<div className="flex flex-wrap gap-2">
				{PRESETS.map((preset) => (
					<Button
						key={preset.expr}
						size="sm"
						variant="outline"
						onClick={() => handlePreset(preset.expr)}
						className="text-xs gap-1.5"
					>
						<Clock className="h-3 w-3" />
						{preset.label}
					</Button>
				))}
			</div>

			{/* Error */}
			{error && (
				<div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* Description */}
			{description && (
				<div className="rounded-lg border bg-muted/50 p-4">
					<div className="flex items-center justify-between gap-2">
						<div>
							<p className="text-xs font-medium text-muted-foreground mb-1">
								Human-readable schedule
							</p>
							<p className="text-sm font-semibold">{description}</p>
						</div>
						<CopyButton text={description} />
					</div>
				</div>
			)}

			{/* Next runs table */}
			{nextRuns.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<h2 className="text-sm font-semibold">Next 10 Runs</h2>
						<Badge variant="secondary" className="text-xs">
							from now
						</Badge>
					</div>
					<div className="rounded-lg border overflow-hidden">
						<table className="w-full text-xs">
							<thead>
								<tr className="border-b bg-muted/50">
									<th className="text-left px-3 py-2 font-medium text-muted-foreground w-10">
										#
									</th>
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										Local Time
									</th>
									<th className="text-left px-3 py-2 font-medium text-muted-foreground">
										UTC
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{nextRuns.map((run, i) => (
									<tr
										// biome-ignore lint/suspicious/noArrayIndexKey: stable ordered list
										key={i}
										className="hover:bg-muted/30"
									>
										<td className="px-3 py-2 text-muted-foreground font-mono">
											{i + 1}
										</td>
										<td className="px-3 py-2 font-mono">
											{formatLocalTime(run)}
										</td>
										<td className="px-3 py-2 font-mono text-muted-foreground">
											{formatUtcTime(run)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Cheat sheet */}
			<div className="rounded-lg border">
				<button
					type="button"
					onClick={() => setShowCheatSheet(!showCheatSheet)}
					className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
					aria-expanded={showCheatSheet}
				>
					<span>Cron Syntax Cheat Sheet</span>
					{showCheatSheet ? (
						<ChevronUp className="h-4 w-4 text-muted-foreground" />
					) : (
						<ChevronDown className="h-4 w-4 text-muted-foreground" />
					)}
				</button>
				{showCheatSheet && (
					<div className="border-t px-4 pb-4 pt-2">
						<p className="text-xs text-muted-foreground mb-3">
							Format:{" "}
							<code className="font-mono bg-muted px-1 py-0.5 rounded">
								minute hour day-of-month month day-of-week
							</code>
						</p>
						<table className="w-full text-xs">
							<thead>
								<tr className="border-b">
									<th className="text-left py-1.5 font-medium text-muted-foreground">
										Field
									</th>
									<th className="text-left py-1.5 font-medium text-muted-foreground">
										Range
									</th>
									<th className="text-left py-1.5 font-medium text-muted-foreground">
										Examples
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{CHEAT_SHEET.map((row) => (
									<tr key={row.field}>
										<td className="py-1.5 font-medium">{row.field}</td>
										<td className="py-1.5 font-mono text-muted-foreground">
											{row.range}
										</td>
										<td className="py-1.5 font-mono text-muted-foreground">
											{row.examples}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className="mt-3 space-y-1 text-xs text-muted-foreground">
							<p>
								<code className="font-mono bg-muted px-1 py-0.5 rounded">
									*
								</code>{" "}
								= any value
							</p>
							<p>
								<code className="font-mono bg-muted px-1 py-0.5 rounded">
									*/N
								</code>{" "}
								= every N units
							</p>
							<p>
								<code className="font-mono bg-muted px-1 py-0.5 rounded">
									A-B
								</code>{" "}
								= range from A to B
							</p>
							<p>
								<code className="font-mono bg-muted px-1 py-0.5 rounded">
									A,B,C
								</code>{" "}
								= list of values
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
