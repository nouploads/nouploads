import { ArrowLeftRight, Check, ClipboardCopy, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
	decodeUrl,
	encodeUrl,
	isValidUrl,
	parseUrl,
	type UrlParseResult,
} from "../processors/url-encoder";

export default function UrlEncoderTool() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"encode" | "decode">("encode");
	const [scope, setScope] = useState<"component" | "full">("component");
	const [copied, setCopied] = useState(false);

	const output = useMemo(() => {
		if (!input) return "";
		try {
			return mode === "encode"
				? encodeUrl(input, scope)
				: decodeUrl(input, scope);
		} catch {
			return "Error: invalid input for this operation";
		}
	}, [input, mode, scope]);

	const parsed = useMemo((): UrlParseResult | null => {
		if (!input.trim()) return null;
		// Try parsing the input itself, or the decoded version
		const toParse = mode === "decode" ? output : input;
		if (!isValidUrl(toParse)) return null;
		return parseUrl(toParse);
	}, [input, output, mode]);

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

	const handleClear = useCallback(() => {
		setInput("");
	}, []);

	const handleSwap = useCallback(() => {
		setMode((m) => (m === "encode" ? "decode" : "encode"));
	}, []);

	return (
		<div className="space-y-4">
			{/* Mode and scope toggles */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex rounded-md border">
					<Button
						size="sm"
						variant={mode === "encode" ? "default" : "ghost"}
						onClick={() => setMode("encode")}
						className="rounded-r-none"
					>
						Encode
					</Button>
					<Button
						size="sm"
						variant={mode === "decode" ? "default" : "ghost"}
						onClick={() => setMode("decode")}
						className="rounded-l-none"
					>
						Decode
					</Button>
				</div>

				<Button
					size="sm"
					variant="outline"
					onClick={handleSwap}
					className="gap-1.5"
					title="Swap mode"
				>
					<ArrowLeftRight className="size-3.5" />
					Swap
				</Button>

				<div className="flex rounded-md border">
					<Button
						size="sm"
						variant={scope === "component" ? "default" : "ghost"}
						onClick={() => setScope("component")}
						className="rounded-r-none"
					>
						Component
					</Button>
					<Button
						size="sm"
						variant={scope === "full" ? "default" : "ghost"}
						onClick={() => setScope("full")}
						className="rounded-l-none"
					>
						Full URL
					</Button>
				</div>

				<div className="ml-auto flex gap-2">
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
						variant="ghost"
						onClick={handleClear}
						disabled={!input}
						className="gap-1.5"
					>
						<Trash2 className="size-3.5" />
						Clear
					</Button>
				</div>
			</div>

			{/* Input */}
			<div>
				<label htmlFor="url-input" className="text-sm font-medium mb-1 block">
					Input
				</label>
				<Textarea
					id="url-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={
						mode === "encode"
							? "hello world&foo=bar"
							: "hello%20world%26foo%3Dbar"
					}
					className="min-h-[100px] font-mono text-sm leading-relaxed resize-y"
					spellCheck={false}
					rows={3}
					aria-label="URL input"
				/>
			</div>

			{/* Output */}
			<div>
				<label htmlFor="url-output" className="text-sm font-medium mb-1 block">
					Output
				</label>
				<Textarea
					id="url-output"
					value={output}
					readOnly
					className="min-h-[100px] font-mono text-sm leading-relaxed resize-y bg-muted"
					spellCheck={false}
					rows={3}
					aria-label="URL output"
				/>
			</div>

			{/* URL breakdown */}
			{parsed && (
				<div className="space-y-3">
					<h3 className="text-sm font-semibold">URL Breakdown</h3>
					<div className="rounded-md border overflow-hidden">
						<table className="w-full text-sm">
							<tbody className="divide-y">
								<tr>
									<td className="px-3 py-2 font-medium text-muted-foreground bg-muted w-[120px]">
										Protocol
									</td>
									<td className="px-3 py-2 font-mono break-all">
										{parsed.protocol}
									</td>
								</tr>
								<tr>
									<td className="px-3 py-2 font-medium text-muted-foreground bg-muted">
										Host
									</td>
									<td className="px-3 py-2 font-mono break-all">
										{parsed.host}
									</td>
								</tr>
								<tr>
									<td className="px-3 py-2 font-medium text-muted-foreground bg-muted">
										Path
									</td>
									<td className="px-3 py-2 font-mono break-all">
										{parsed.pathname}
									</td>
								</tr>
								{parsed.hash && (
									<tr>
										<td className="px-3 py-2 font-medium text-muted-foreground bg-muted">
											Hash
										</td>
										<td className="px-3 py-2 font-mono break-all">
											{parsed.hash}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{parsed.params.length > 0 && (
						<>
							<h3 className="text-sm font-semibold">Query Parameters</h3>
							<div className="rounded-md border overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-muted">
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">
												Key
											</th>
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">
												Value (decoded)
											</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{parsed.params.map((param, i) => (
											<tr
												// biome-ignore lint/suspicious/noArrayIndexKey: static param list
												key={i}
											>
												<td className="px-3 py-2 font-mono break-all">
													{param.key}
												</td>
												<td className="px-3 py-2 font-mono break-all">
													{param.value}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}
