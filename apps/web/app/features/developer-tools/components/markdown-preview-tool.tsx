import {
	Bold,
	Check,
	ClipboardCopy,
	Code,
	Download,
	FileUp,
	Heading,
	Italic,
	Link,
	List,
	Table,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { formatFileSize } from "~/lib/utils";
import {
	getCharCount,
	getLineCount,
	getWordCount,
	MAX_MARKDOWN_SIZE,
	renderMarkdown,
} from "../processors/markdown-preview";

const PLACEHOLDER_MARKDOWN = `# Welcome to Markdown Preview

Write or paste your **Markdown** here and see it rendered in real time.

## Features

- **Bold**, *italic*, and ~~strikethrough~~ text
- [Links](https://nouploads.com) and images
- Code blocks with syntax highlighting

\`\`\`javascript
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

## Task List

- [x] Write Markdown
- [x] See live preview
- [ ] Copy rendered HTML

## Table

| Feature | Supported |
|---------|-----------|
| GFM Tables | Yes |
| Task Lists | Yes |
| Strikethrough | Yes |

> Blockquotes are supported too.

---

Enjoy writing Markdown with **NoUploads** — everything stays in your browser.
`;

function insertMarkdownSyntax(
	textarea: HTMLTextAreaElement,
	before: string,
	after: string,
	placeholder: string,
	setInput: (v: string) => void,
) {
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	const selected = text.slice(start, end);
	const insert = selected.length > 0 ? selected : placeholder;
	const newText =
		text.slice(0, start) + before + insert + after + text.slice(end);
	setInput(newText);

	// Restore cursor position after React re-render
	requestAnimationFrame(() => {
		textarea.focus();
		textarea.setSelectionRange(
			start + before.length,
			start + before.length + insert.length,
		);
	});
}

const TABLE_TEMPLATE = `| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
`;

export default function MarkdownPreviewTool() {
	const [input, setInput] = useState("");
	const [html, setHtml] = useState("");
	const [copiedHtml, setCopiedHtml] = useState(false);
	const [sizeError, setSizeError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

	// Render markdown with debounce
	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			if (!input.trim()) {
				setHtml("");
				return;
			}
			const rendered = renderMarkdown(input, { gfm: true });
			setHtml(rendered);
		}, 100);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [input]);

	const handleCopyHtml = useCallback(async () => {
		if (!html) return;
		try {
			await navigator.clipboard.writeText(html);
			setCopiedHtml(true);
			setTimeout(() => setCopiedHtml(false), 2000);
		} catch {
			// clipboard may be blocked
		}
	}, [html]);

	const handleDownload = useCallback(() => {
		if (!input.trim()) return;
		const blob = new Blob([input], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "document.md";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [input]);

	const handleClear = useCallback(() => {
		setInput("");
		setHtml("");
		setSizeError(null);
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_MARKDOWN_SIZE) {
				setSizeError(
					`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_MARKDOWN_SIZE)}.`,
				);
				return;
			}

			setSizeError(null);
			const reader = new FileReader();
			reader.onload = () => {
				setInput(reader.result as string);
			};
			reader.readAsText(file);
			e.target.value = "";
		},
		[],
	);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file) return;

		if (file.size > MAX_MARKDOWN_SIZE) {
			setSizeError(
				`File too large (${formatFileSize(file.size)}). Maximum is ${formatFileSize(MAX_MARKDOWN_SIZE)}.`,
			);
			return;
		}

		setSizeError(null);
		const reader = new FileReader();
		reader.onload = () => {
			setInput(reader.result as string);
		};
		reader.readAsText(file);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const insertSyntax = useCallback(
		(before: string, after: string, placeholder: string) => {
			const ta = textareaRef.current;
			if (!ta) return;
			insertMarkdownSyntax(ta, before, after, placeholder, setInput);
		},
		[],
	);

	const toolbarButtons = [
		{
			label: "Bold",
			icon: Bold,
			action: () => insertSyntax("**", "**", "bold text"),
		},
		{
			label: "Italic",
			icon: Italic,
			action: () => insertSyntax("*", "*", "italic text"),
		},
		{
			label: "Heading",
			icon: Heading,
			action: () => insertSyntax("## ", "", "Heading"),
		},
		{
			label: "Link",
			icon: Link,
			action: () => insertSyntax("[", "](https://)", "link text"),
		},
		{
			label: "Code",
			icon: Code,
			action: () => insertSyntax("`", "`", "code"),
		},
		{
			label: "List",
			icon: List,
			action: () => insertSyntax("- ", "", "List item"),
		},
		{
			label: "Table",
			icon: Table,
			action: () => insertSyntax(TABLE_TEMPLATE, "", ""),
		},
	];

	const wordCount = getWordCount(input);
	const charCount = getCharCount(input);
	const lineCount = getLineCount(input);

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
				{toolbarButtons.map((btn) => (
					<Button
						key={btn.label}
						size="sm"
						variant="secondary"
						onClick={btn.action}
						className="gap-1.5"
						aria-label={`Insert ${btn.label}`}
					>
						<btn.icon className="size-3.5" />
						{btn.label}
					</Button>
				))}

				<div className="mx-2 h-6 w-px bg-border" />

				<Button
					size="sm"
					variant="secondary"
					onClick={handleCopyHtml}
					disabled={!html}
					className="gap-1.5"
				>
					{copiedHtml ? (
						<Check className="size-3.5" />
					) : (
						<ClipboardCopy className="size-3.5" />
					)}
					{copiedHtml ? "Copied" : "Copy HTML"}
				</Button>
				<Button
					size="sm"
					variant="secondary"
					onClick={handleDownload}
					disabled={!input.trim()}
					className="gap-1.5"
				>
					<Download className="size-3.5" />
					Download .md
				</Button>
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

				<div className="ml-auto">
					<input
						ref={fileInputRef}
						type="file"
						accept=".md,.txt,.markdown,text/markdown,text/plain"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload Markdown file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload .md
					</Button>
				</div>
			</div>

			{/* Size error */}
			{sizeError && <p className="text-sm text-destructive">{sizeError}</p>}

			{/* Split editor/preview */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* Editor */}
				<div className="flex flex-col">
					<div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Markdown
					</div>
					<Textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						placeholder={PLACEHOLDER_MARKDOWN}
						className="min-h-[500px] font-mono text-sm leading-relaxed resize-y flex-1"
						spellCheck={false}
						aria-label="Markdown input"
					/>
				</div>

				{/* Preview */}
				<div className="flex flex-col">
					<div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Preview
					</div>
					<div className="min-h-[500px] rounded-md border border-input bg-transparent p-4 overflow-auto dark:bg-input/30">
						{html ? (
							<div
								className="prose prose-sm dark:prose-invert max-w-none prose-table:border-collapse prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm prose-pre:bg-muted prose-pre:rounded prose-pre:p-4 prose-pre:font-mono prose-pre:text-sm prose-pre:overflow-x-auto prose-img:rounded-md prose-a:text-primary prose-a:underline"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: user's own content rendered in their browser
								dangerouslySetInnerHTML={{
									__html: html,
								}}
							/>
						) : (
							<p className="text-muted-foreground text-sm italic">
								Start typing Markdown to see a live preview...
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Statistics */}
			{input.length > 0 && (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span>
						Words:{" "}
						<span className="font-medium text-foreground">{wordCount}</span>
					</span>
					<span>
						Characters:{" "}
						<span className="font-medium text-foreground">{charCount}</span>
					</span>
					<span>
						Lines:{" "}
						<span className="font-medium text-foreground">{lineCount}</span>
					</span>
				</div>
			)}
		</div>
	);
}
