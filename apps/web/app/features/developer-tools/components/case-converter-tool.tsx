import { Check, ClipboardCopy, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { CASE_STYLES, convertCase } from "../processors/case-converter";

const PLACEHOLDER = "hello world example";

export default function CaseConverterTool() {
	const [input, setInput] = useState("");
	const [copiedStyle, setCopiedStyle] = useState<string | null>(null);

	const results = useMemo(() => {
		if (!input.trim()) return [];
		return CASE_STYLES.map((style) => ({
			...style,
			output: convertCase(input, style.value),
		}));
	}, [input]);

	const handleCopy = useCallback(async (text: string, style: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedStyle(style);
			setTimeout(() => setCopiedStyle(null), 2000);
		} catch {
			// clipboard may be blocked
		}
	}, []);

	const handleClear = useCallback(() => {
		setInput("");
		setCopiedStyle(null);
	}, []);

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant="ghost"
					onClick={handleClear}
					disabled={!input.trim()}
					className="gap-1.5"
				>
					<Trash2 className="size-3.5" />
					Clear
				</Button>
			</div>

			{/* Input */}
			<div>
				<label htmlFor="case-input" className="text-sm font-medium mb-1 block">
					Input text
				</label>
				<Textarea
					id="case-input"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={PLACEHOLDER}
					className="min-h-[120px] font-mono text-sm leading-relaxed resize-y"
					spellCheck={false}
					rows={4}
					aria-label="Text input"
				/>
			</div>

			{/* Results table */}
			{results.length > 0 && (
				<div>
					<h3 className="text-sm font-semibold mb-2">All conversions</h3>
					<div className="rounded-md border overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-muted">
									<th className="px-3 py-2 text-left font-medium text-muted-foreground w-[160px]">
										Style
									</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">
										Result
									</th>
									<th className="px-3 py-2 w-[80px]" />
								</tr>
							</thead>
							<tbody className="divide-y">
								{results.map((r) => (
									<tr key={r.value}>
										<td className="px-3 py-2 font-medium text-muted-foreground">
											{r.label}
										</td>
										<td className="px-3 py-2 font-mono break-all">
											{r.output}
										</td>
										<td className="px-3 py-2">
											<Button
												size="sm"
												variant="ghost"
												onClick={() => handleCopy(r.output, r.value)}
												className="gap-1 h-7 px-2"
												aria-label={`Copy ${r.label} result`}
											>
												{copiedStyle === r.value ? (
													<>
														<Check className="size-3" />
														<span className="text-xs">Copied</span>
													</>
												) : (
													<>
														<ClipboardCopy className="size-3" />
														<span className="text-xs">Copy</span>
													</>
												)}
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
