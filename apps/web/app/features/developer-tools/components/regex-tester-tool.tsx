import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
	type RegexResult,
	testRegex,
	validateRegex,
} from "../processors/regex-tester";

const FLAG_OPTIONS = [
	{ flag: "g", label: "global", description: "Find all matches" },
	{ flag: "i", label: "insensitive", description: "Case insensitive" },
	{ flag: "m", label: "multiline", description: "^ and $ match lines" },
	{ flag: "s", label: "dotAll", description: ". matches newlines" },
	{ flag: "u", label: "unicode", description: "Unicode support" },
] as const;

const CHEAT_SHEET = [
	{ pattern: ".", description: "Any character (except newline)" },
	{ pattern: "\\d", description: "Digit [0-9]" },
	{ pattern: "\\w", description: "Word character [a-zA-Z0-9_]" },
	{ pattern: "\\s", description: "Whitespace" },
	{ pattern: "\\b", description: "Word boundary" },
	{ pattern: "[abc]", description: "Character set" },
	{ pattern: "[^abc]", description: "Negated character set" },
	{ pattern: "a|b", description: "Alternation (a or b)" },
	{ pattern: "(abc)", description: "Capture group" },
	{ pattern: "(?:abc)", description: "Non-capturing group" },
	{ pattern: "(?<name>abc)", description: "Named capture group" },
	{ pattern: "a*", description: "Zero or more" },
	{ pattern: "a+", description: "One or more" },
	{ pattern: "a?", description: "Zero or one" },
	{ pattern: "a{3}", description: "Exactly 3" },
	{ pattern: "a{3,}", description: "3 or more" },
	{ pattern: "a{3,5}", description: "Between 3 and 5" },
	{ pattern: "^", description: "Start of string/line" },
	{ pattern: "$", description: "End of string/line" },
	{ pattern: "(?=abc)", description: "Positive lookahead" },
	{ pattern: "(?!abc)", description: "Negative lookahead" },
] as const;

const DEFAULT_TEST_STRING =
	"2025-01-15 meeting with john@example.com\n2025-03-20 call with jane@test.org";

export default function RegexTesterTool() {
	const [pattern, setPattern] = useState("");
	const [flags, setFlags] = useState<Set<string>>(new Set(["g"]));
	const [testString, setTestString] = useState("");
	const [result, setResult] = useState<RegexResult>({
		matches: [],
		matchCount: 0,
		error: null,
	});
	const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const flagString = Array.from(flags).sort().join("");

	// Debounced regex evaluation
	useEffect(() => {
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			if (!pattern) {
				setResult({ matches: [], matchCount: 0, error: null });
				return;
			}
			const r = testRegex(pattern, flagString, testString);
			setResult(r);
		}, 150);

		return () => clearTimeout(debounceRef.current);
	}, [pattern, flagString, testString]);

	const toggleFlag = useCallback((flag: string) => {
		setFlags((prev) => {
			const next = new Set(prev);
			if (next.has(flag)) {
				next.delete(flag);
			} else {
				next.add(flag);
			}
			return next;
		});
	}, []);

	// Build highlighted text segments
	const highlightedSegments = useCallback(() => {
		if (!testString || !pattern || result.error || result.matchCount === 0) {
			return null;
		}

		const validation = validateRegex(pattern, flagString);
		if (!validation.valid) return null;

		const effectiveFlags = flagString.includes("g")
			? flagString
			: `${flagString}g`;
		const regex = new RegExp(pattern, effectiveFlags);
		const segments: Array<{
			text: string;
			isMatch: boolean;
		}> = [];
		let lastIndex = 0;

		for (const match of testString.matchAll(regex)) {
			const matchIndex = match.index ?? 0;
			if (matchIndex > lastIndex) {
				segments.push({
					text: testString.slice(lastIndex, matchIndex),
					isMatch: false,
				});
			}
			segments.push({
				text: match[0],
				isMatch: true,
			});
			lastIndex = matchIndex + match[0].length;
		}

		if (lastIndex < testString.length) {
			segments.push({
				text: testString.slice(lastIndex),
				isMatch: false,
			});
		}

		return segments;
	}, [testString, pattern, result, flagString]);

	const segments = highlightedSegments();

	return (
		<div className="space-y-6">
			{/* Regex pattern input */}
			<div className="space-y-2">
				<label htmlFor="regex-pattern" className="text-sm font-medium">
					Regular Expression
				</label>
				<div className="flex items-center gap-0">
					<span className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground font-mono">
						/
					</span>
					<Input
						id="regex-pattern"
						value={pattern}
						onChange={(e) => setPattern(e.target.value)}
						placeholder="Enter regex pattern..."
						className="rounded-none border-x-0 font-mono"
						spellCheck={false}
						aria-label="Regex pattern"
					/>
					<span className="flex h-9 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground font-mono">
						/{flagString}
					</span>
				</div>

				{/* Validation error */}
				{result.error && (
					<div className="flex items-center gap-1.5 text-sm text-destructive">
						<AlertCircle className="size-3.5 shrink-0" />
						<span>{result.error}</span>
					</div>
				)}
			</div>

			{/* Flag toggles */}
			<div className="space-y-2">
				<span className="text-sm font-medium">Flags</span>
				<div className="flex flex-wrap gap-2">
					{FLAG_OPTIONS.map(({ flag, label, description }) => (
						<button
							key={flag}
							type="button"
							onClick={() => toggleFlag(flag)}
							className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
								flags.has(flag)
									? "border-primary bg-primary/10 text-primary"
									: "border-input bg-transparent text-muted-foreground hover:bg-muted"
							}`}
							title={description}
							aria-label={`${label} flag (${flag})`}
							aria-pressed={flags.has(flag)}
						>
							<span className="font-mono">{flag}</span>
							<span className="hidden sm:inline">{label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Test string */}
			<div className="space-y-2">
				<label htmlFor="test-string" className="text-sm font-medium">
					Test String
				</label>
				<Textarea
					id="test-string"
					value={testString}
					onChange={(e) => setTestString(e.target.value)}
					placeholder={DEFAULT_TEST_STRING}
					className="min-h-[120px] font-mono text-sm leading-relaxed resize-y"
					spellCheck={false}
					aria-label="Test string"
				/>
			</div>

			{/* Highlighted output */}
			{testString && pattern && !result.error && (
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">Highlighted Matches</span>
						{result.matchCount > 0 && (
							<Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
								{result.matchCount}{" "}
								{result.matchCount === 1 ? "match" : "matches"}
							</Badge>
						)}
					</div>
					<div className="rounded-md border border-input bg-muted/50 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
						{segments
							? segments.map((seg, i) =>
									seg.isMatch ? (
										<mark
											// biome-ignore lint/suspicious/noArrayIndexKey: static segments from regex split
											key={i}
											className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5"
										>
											{seg.text}
										</mark>
									) : (
										// biome-ignore lint/suspicious/noArrayIndexKey: static segments from regex split
										<span key={i}>{seg.text}</span>
									),
								)
							: testString}
					</div>
				</div>
			)}

			{/* Match results */}
			{pattern && !result.error && (
				<div className="space-y-2">
					<span className="text-sm font-medium">Match Details</span>
					{result.matchCount === 0 ? (
						<p className="text-sm text-muted-foreground">No matches found.</p>
					) : (
						<div className="rounded-lg border divide-y overflow-x-auto">
							<div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
								<span>#</span>
								<span>Match</span>
								<span>Groups</span>
							</div>
							{result.matches.map((m, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static match list
									key={i}
									className="grid grid-cols-[auto_1fr_1fr] gap-x-4 px-4 py-2 text-sm"
								>
									<span className="text-xs text-muted-foreground tabular-nums">
										{i + 1}
									</span>
									<span className="font-mono break-all">
										<span className="text-xs text-muted-foreground mr-1">
											@{m.index}
										</span>
										{m.fullMatch}
									</span>
									<span className="font-mono text-xs break-all">
										{m.groups.length > 0
											? m.groups.map((g, gi) => (
													<span
														// biome-ignore lint/suspicious/noArrayIndexKey: static group list
														key={gi}
														className="inline-block mr-2 mb-1 rounded bg-muted px-1.5 py-0.5"
													>
														${gi + 1}: {g || "(empty)"}
													</span>
												))
											: "—"}
										{m.groupNames &&
											Object.entries(m.groupNames).map(([name, val]) => (
												<span
													key={name}
													className="inline-block mr-2 mb-1 rounded bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5"
												>
													{name}: {val || "(empty)"}
												</span>
											))}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Cheat Sheet */}
			<div className="border rounded-lg">
				<button
					type="button"
					onClick={() => setCheatSheetOpen(!cheatSheetOpen)}
					className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
					aria-expanded={cheatSheetOpen}
				>
					{cheatSheetOpen ? (
						<ChevronDown className="size-4" />
					) : (
						<ChevronRight className="size-4" />
					)}
					Regex Cheat Sheet
				</button>
				{cheatSheetOpen && (
					<div className="border-t px-4 py-3">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
							{CHEAT_SHEET.map(({ pattern: p, description }) => (
								<div key={p} className="flex items-baseline gap-2 text-xs">
									<code className="font-mono font-medium text-primary whitespace-nowrap">
										{p}
									</code>
									<span className="text-muted-foreground">{description}</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
