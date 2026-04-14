import { Check, Copy, Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	countChars,
	countWords,
	generateParagraphs,
	generateSentences,
	generateWords,
} from "../processors/lorem-ipsum";

type Mode = "paragraphs" | "sentences" | "words";

const MIN_COUNT = 1;
const MAX_COUNT = 100;

export default function LoremIpsumTool() {
	const [mode, setMode] = useState<Mode>("paragraphs");
	const [count, setCount] = useState(5);
	// Raw input string is tracked separately so the user can clear the field
	// and retype without React snapping the controlled input back to `count`.
	const [countInput, setCountInput] = useState("5");
	const [countError, setCountError] = useState<string | null>(null);
	const [classicStart, setClassicStart] = useState(true);
	const [output, setOutput] = useState("");
	const [copied, setCopied] = useState(false);
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Generate text whenever mode/count/classicStart changes
	useEffect(() => {
		const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, count));
		let text: string;
		switch (mode) {
			case "sentences":
				text = generateSentences(clamped, classicStart);
				break;
			case "words":
				text = generateWords(clamped, classicStart);
				break;
			default:
				text = generateParagraphs(clamped, classicStart);
		}
		setOutput(text);
	}, [mode, count, classicStart]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => clearTimeout(copyTimeoutRef.current);
	}, []);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(output);
		setCopied(true);
		clearTimeout(copyTimeoutRef.current);
		copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
	}, [output]);

	const handleDownload = useCallback(() => {
		const blob = new Blob([output], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `lorem-ipsum-${mode}-${count}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [output, mode, count]);

	const handleCountChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value;
			setCountInput(raw);
			if (raw === "") {
				setCountError(null);
				return;
			}
			const val = Number.parseInt(raw, 10);
			if (Number.isNaN(val)) {
				setCountError("Enter a whole number");
				return;
			}
			if (val > MAX_COUNT) {
				setCountError(`Max is ${MAX_COUNT}`);
				setCount(MAX_COUNT);
				return;
			}
			if (val < MIN_COUNT) {
				setCountError(`Min is ${MIN_COUNT}`);
				setCount(MIN_COUNT);
				return;
			}
			setCountError(null);
			setCount(val);
		},
		[],
	);

	const handleCountBlur = useCallback(() => {
		// Snap the input back to the current valid count on blur so the field
		// never stays empty or out-of-range after the user leaves it.
		setCountInput(String(count));
		setCountError(null);
	}, [count]);

	const words = countWords(output);
	const chars = countChars(output);

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				{/* Mode toggle */}
				<div className="flex rounded-lg border overflow-hidden">
					{(["paragraphs", "sentences", "words"] as const).map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => setMode(m)}
							className={`px-3 py-1.5 text-sm font-medium transition-colors capitalize ${
								mode === m
									? "bg-primary text-primary-foreground"
									: "hover:bg-muted"
							}`}
						>
							{m}
						</button>
					))}
				</div>

				{/* Count input */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="lorem-count"
						className="text-sm text-muted-foreground"
					>
						Count:
					</label>
					<Input
						id="lorem-count"
						type="number"
						min={MIN_COUNT}
						max={MAX_COUNT}
						value={countInput}
						onChange={handleCountChange}
						onBlur={handleCountBlur}
						aria-invalid={countError !== null}
						aria-describedby={countError ? "lorem-count-error" : undefined}
						className={`w-20 ${countError ? "border-destructive" : ""}`}
					/>
					{countError && (
						<span
							id="lorem-count-error"
							role="alert"
							className="text-xs text-destructive"
						>
							{countError}
						</span>
					)}
				</div>

				{/* Classic start checkbox */}
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<input
						type="checkbox"
						checked={classicStart}
						onChange={(e) => setClassicStart(e.target.checked)}
						className="rounded border-gray-300"
					/>
					Start with classic opening
				</label>
			</div>

			{/* Output textarea */}
			<textarea
				readOnly
				value={output}
				className="w-full min-h-[300px] rounded-lg border bg-muted/50 p-4 font-mono text-sm resize-y focus:outline-none"
				aria-label="Generated lorem ipsum text"
			/>

			{/* Action buttons + stats */}
			<div className="flex items-center gap-3 flex-wrap">
				<Button onClick={handleCopy} variant="outline" className="gap-1.5">
					{copied ? (
						<Check className="h-3.5 w-3.5 text-green-500" />
					) : (
						<Copy className="h-3.5 w-3.5" />
					)}
					{copied ? "Copied" : "Copy"}
				</Button>
				<Button onClick={handleDownload} variant="outline" className="gap-1.5">
					<Download className="h-3.5 w-3.5" />
					Download .txt
				</Button>
				<span className="text-xs text-muted-foreground ml-auto">
					{words.toLocaleString()} words · {chars.toLocaleString()} characters
				</span>
			</div>
		</div>
	);
}
