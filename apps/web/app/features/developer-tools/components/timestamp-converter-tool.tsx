import {
	ArrowRightLeft,
	Calendar,
	Check,
	Clock,
	Copy,
	Globe,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	fromDate,
	fromTimestamp,
	isMilliseconds,
	type TimestampResult,
} from "../processors/timestamp-converter";

// ─── Copy button ──────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
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

// ─── Result row ───────────────────────────────────────────────

function ResultRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 px-4 py-3">
			<span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
				{label}
			</span>
			<span className="font-mono text-xs break-all flex-1 min-w-0 select-all">
				{value}
			</span>
			<CopyButton text={value} />
		</div>
	);
}

// ─── Timestamp → Date panel ───────────────────────────────────

function TimestampToDatePanel() {
	const [input, setInput] = useState("");
	const [result, setResult] = useState<TimestampResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [detectedUnit, setDetectedUnit] = useState<
		"seconds" | "milliseconds" | null
	>(null);
	const [isLive, setIsLive] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

	const convert = useCallback((value: string) => {
		const trimmed = value.trim();
		if (!trimmed) {
			setResult(null);
			setError(null);
			setDetectedUnit(null);
			return;
		}

		const num = Number(trimmed);
		if (Number.isNaN(num)) {
			setResult(null);
			setError("Not a valid number");
			setDetectedUnit(null);
			return;
		}

		try {
			const r = fromTimestamp(num);
			setResult(r);
			setError(null);
			setDetectedUnit(isMilliseconds(num) ? "milliseconds" : "seconds");
		} catch (err) {
			setResult(null);
			setError(err instanceof Error ? err.message : "Invalid timestamp");
			setDetectedUnit(null);
		}
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setInput(value);
			setIsLive(false);
			clearInterval(intervalRef.current);
			convert(value);
		},
		[convert],
	);

	const handleNow = useCallback(() => {
		const now = Math.floor(Date.now() / 1000);
		setInput(String(now));
		convert(String(now));
		setIsLive(true);
	}, [convert]);

	// Live ticking
	useEffect(() => {
		if (!isLive) {
			clearInterval(intervalRef.current);
			return;
		}

		intervalRef.current = setInterval(() => {
			const now = Math.floor(Date.now() / 1000);
			setInput(String(now));
			convert(String(now));
		}, 1000);

		return () => clearInterval(intervalRef.current);
	}, [isLive, convert]);

	// Cleanup on unmount
	useEffect(() => {
		return () => clearInterval(intervalRef.current);
	}, []);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Clock className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-sm font-semibold">Timestamp to Date</h2>
			</div>

			<div className="space-y-2">
				<label htmlFor="ts-input" className="text-sm font-medium">
					Unix timestamp
				</label>
				<div className="flex gap-2">
					<Input
						id="ts-input"
						type="text"
						inputMode="numeric"
						value={input}
						onChange={handleChange}
						placeholder="1700000000"
						className="font-mono text-sm"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={handleNow}
						className="shrink-0 gap-1.5"
					>
						<ArrowRightLeft className="h-3.5 w-3.5" />
						Now
					</Button>
				</div>
				{detectedUnit && (
					<Badge variant="secondary" className="text-xs">
						Detected: {detectedUnit}
					</Badge>
				)}
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{result && (
				<div className="rounded-lg border divide-y">
					<ResultRow label="Unix (s)" value={String(result.unix)} />
					<ResultRow label="Unix (ms)" value={String(result.unixMs)} />
					<ResultRow label="ISO 8601" value={result.iso8601} />
					<ResultRow label="RFC 2822" value={result.rfc2822} />
					<ResultRow label="UTC" value={result.utc} />
					<ResultRow label="Local" value={result.local} />
					<ResultRow label="Date" value={result.date} />
					<ResultRow label="Time" value={result.time} />
					<ResultRow label="Relative" value={result.relative} />
				</div>
			)}
		</div>
	);
}

// ─── Date → Timestamp panel ───────────────────────────────────

function DateToTimestampPanel() {
	const [dateInput, setDateInput] = useState("");
	const [timeInput, setTimeInput] = useState("");
	const [textInput, setTextInput] = useState("");
	const [result, setResult] = useState<TimestampResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mode, setMode] = useState<"picker" | "text">("picker");

	// Convert from date+time picker
	useEffect(() => {
		if (mode !== "picker") return;

		if (!dateInput) {
			setResult(null);
			setError(null);
			return;
		}

		const dateStr = timeInput
			? `${dateInput}T${timeInput}`
			: `${dateInput}T00:00:00`;

		try {
			const r = fromDate(dateStr);
			setResult(r);
			setError(null);
		} catch (err) {
			setResult(null);
			setError(err instanceof Error ? err.message : "Invalid date");
		}
	}, [dateInput, timeInput, mode]);

	// Convert from text input
	useEffect(() => {
		if (mode !== "text") return;

		const trimmed = textInput.trim();
		if (!trimmed) {
			setResult(null);
			setError(null);
			return;
		}

		try {
			const r = fromDate(trimmed);
			setResult(r);
			setError(null);
		} catch (err) {
			setResult(null);
			setError(err instanceof Error ? err.message : "Invalid date");
		}
	}, [textInput, mode]);

	const handleNow = useCallback(() => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const hh = String(now.getHours()).padStart(2, "0");
		const mm = String(now.getMinutes()).padStart(2, "0");

		if (mode === "picker") {
			setDateInput(`${year}-${month}-${day}`);
			setTimeInput(`${hh}:${mm}`);
		} else {
			setTextInput(now.toISOString());
		}
	}, [mode]);

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 mb-2">
				<Calendar className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-sm font-semibold">Date to Timestamp</h2>
			</div>

			{/* Mode toggle */}
			<div className="flex gap-2">
				<Button
					size="sm"
					variant={mode === "picker" ? "default" : "outline"}
					onClick={() => setMode("picker")}
					className="gap-1.5"
				>
					<Calendar className="h-3.5 w-3.5" />
					Date picker
				</Button>
				<Button
					size="sm"
					variant={mode === "text" ? "default" : "outline"}
					onClick={() => setMode("text")}
					className="gap-1.5"
				>
					<Clock className="h-3.5 w-3.5" />
					Text input
				</Button>
				<div className="ml-auto">
					<Button
						size="sm"
						variant="outline"
						onClick={handleNow}
						className="gap-1.5"
					>
						<ArrowRightLeft className="h-3.5 w-3.5" />
						Now
					</Button>
				</div>
			</div>

			{mode === "picker" ? (
				<div className="flex gap-2">
					<div className="flex-1 space-y-1">
						<label
							htmlFor="date-input"
							className="text-xs font-medium text-muted-foreground"
						>
							Date
						</label>
						<Input
							id="date-input"
							type="date"
							value={dateInput}
							onChange={(e) => setDateInput(e.target.value)}
							className="font-mono text-sm"
						/>
					</div>
					<div className="flex-1 space-y-1">
						<label
							htmlFor="time-input"
							className="text-xs font-medium text-muted-foreground"
						>
							Time
						</label>
						<Input
							id="time-input"
							type="time"
							step="1"
							value={timeInput}
							onChange={(e) => setTimeInput(e.target.value)}
							className="font-mono text-sm"
						/>
					</div>
				</div>
			) : (
				<div className="space-y-1">
					<label
						htmlFor="text-date-input"
						className="text-xs font-medium text-muted-foreground"
					>
						Date string (ISO 8601, RFC 2822, etc.)
					</label>
					<Input
						id="text-date-input"
						type="text"
						value={textInput}
						onChange={(e) => setTextInput(e.target.value)}
						placeholder="2023-11-14T22:13:20.000Z"
						className="font-mono text-sm"
					/>
				</div>
			)}

			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			{result && (
				<div className="rounded-lg border divide-y">
					<ResultRow label="Unix (s)" value={String(result.unix)} />
					<ResultRow label="Unix (ms)" value={String(result.unixMs)} />
					<ResultRow label="ISO 8601" value={result.iso8601} />
					<ResultRow label="RFC 2822" value={result.rfc2822} />
					<ResultRow label="UTC" value={result.utc} />
					<ResultRow label="Local" value={result.local} />
					<ResultRow label="Relative" value={result.relative} />
				</div>
			)}
		</div>
	);
}

// ─── Timezone display ─────────────────────────────────────────

function TimezoneDisplay() {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const offset = new Date().getTimezoneOffset();
	const sign = offset <= 0 ? "+" : "-";
	const absOffset = Math.abs(offset);
	const hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
	const minutes = String(absOffset % 60).padStart(2, "0");

	return (
		<div className="flex items-center gap-2 text-xs text-muted-foreground">
			<Globe className="h-3.5 w-3.5" />
			<span>
				Your timezone: <span className="font-medium text-foreground">{tz}</span>{" "}
				(UTC{sign}
				{hours}:{minutes})
			</span>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────

export default function TimestampConverterTool() {
	return (
		<div className="space-y-6">
			<TimezoneDisplay />

			<div className="grid gap-6 md:grid-cols-2">
				<TimestampToDatePanel />
				<DateToTimestampPanel />
			</div>
		</div>
	);
}
