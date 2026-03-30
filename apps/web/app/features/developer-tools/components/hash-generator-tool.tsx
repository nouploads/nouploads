import { Check, Copy, FileText, Type, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import { generateHashes, type HashResult } from "../processors/hash-generator";

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
			aria-label={copied ? "Copied" : "Copy hash"}
		>
			{copied ? (
				<Check className="h-3.5 w-3.5 text-green-500" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
		</Button>
	);
}

// ─── Hash results table ───────────────────────────────────────

const ALGORITHMS: { key: keyof HashResult; label: string }[] = [
	{ key: "md5", label: "MD5" },
	{ key: "sha1", label: "SHA-1" },
	{ key: "sha256", label: "SHA-256" },
	{ key: "sha384", label: "SHA-384" },
	{ key: "sha512", label: "SHA-512" },
];

function HashResultsTable({
	result,
	computing,
}: {
	result: HashResult | null;
	computing: boolean;
}) {
	if (!result && !computing) return null;

	return (
		<div className="rounded-lg border divide-y">
			{ALGORITHMS.map(({ key, label }) => (
				<div key={key} className="flex items-center gap-3 px-4 py-3">
					<span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
						{label}
					</span>
					<span className="font-mono text-xs break-all flex-1 min-w-0 select-all">
						{computing && !result ? (
							<span className="text-muted-foreground">Computing...</span>
						) : (
							(result?.[key] ?? "")
						)}
					</span>
					{result?.[key] && <CopyButton text={result[key]} />}
				</div>
			))}
		</div>
	);
}

// ─── Text tab ─────────────────────────────────────────────────

function TextTab() {
	const [text, setText] = useState("");
	const [result, setResult] = useState<HashResult | null>(null);
	const [computing, setComputing] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const computeHashes = useCallback((value: string) => {
		const encoder = new TextEncoder();
		const data = encoder.encode(value);
		setComputing(true);

		generateHashes(data)
			.then((r) => {
				setResult(r);
				setComputing(false);
			})
			.catch(() => {
				setComputing(false);
			});
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const value = e.target.value;
			setText(value);

			clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				computeHashes(value);
			}, 300);
		},
		[computeHashes],
	);

	// Compute initial hash for empty string
	useEffect(() => {
		computeHashes("");
		return () => clearTimeout(debounceRef.current);
	}, [computeHashes]);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label htmlFor="hash-text" className="text-sm font-medium">
					Text to hash
				</label>
				<Textarea
					id="hash-text"
					placeholder="Type or paste text here..."
					value={text}
					onChange={handleChange}
					className="min-h-32 font-mono text-sm"
				/>
				<p className="text-xs text-muted-foreground">
					{new TextEncoder().encode(text).length} bytes
				</p>
			</div>

			<HashResultsTable result={result} computing={computing} />
		</div>
	);
}

// ─── File tab ─────────────────────────────────────────────────

function FileTab() {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<HashResult | null>(null);
	const [computing, setComputing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		if (!f) return;
		setFile(f);
		setResult(null);
		setError(null);
		setComputing(true);

		f.arrayBuffer()
			.then((buf) => generateHashes(new Uint8Array(buf)))
			.then((r) => {
				setResult(r);
				setComputing(false);
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to hash file");
				setComputing(false);
			});
	}, []);

	const handleReset = useCallback(() => {
		setFile(null);
		setResult(null);
		setError(null);
		setComputing(false);
	}, []);

	if (!file) {
		return (
			<div className="h-[200px]">
				<ToolDropzone onFiles={handleFiles} />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-4 rounded-lg border p-4">
				<FileText className="h-10 w-10 shrink-0 text-muted-foreground" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium truncate">{file.name}</p>
					<p className="text-xs text-muted-foreground">
						{file.type || "unknown type"} · {formatFileSize(file.size)}
					</p>
				</div>
				{computing && <Spinner className="size-5 shrink-0" />}
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
					{error}
				</div>
			)}

			<HashResultsTable result={result} computing={computing} />

			<Button variant="outline" onClick={handleReset} className="gap-1.5">
				<Upload className="h-3.5 w-3.5" />
				Hash another file
			</Button>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────

export default function HashGeneratorTool() {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="text">
				<TabsList>
					<TabsTrigger value="text" className="gap-1.5">
						<Type className="h-3.5 w-3.5" />
						Text
					</TabsTrigger>
					<TabsTrigger value="file" className="gap-1.5">
						<FileText className="h-3.5 w-3.5" />
						File
					</TabsTrigger>
				</TabsList>
				<TabsContent value="text">
					<TextTab />
				</TabsContent>
				<TabsContent value="file">
					<FileTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
