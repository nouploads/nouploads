import { FileUp, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { analyzeText, type TextStats } from "../processors/word-counter";

const MAX_TEXT_SIZE = 10 * 1024 * 1024; // 10 MB

export default function WordCounterTool() {
	const [input, setInput] = useState("");
	const [stats, setStats] = useState<TextStats>({
		characters: 0,
		charactersNoSpaces: 0,
		words: 0,
		sentences: 0,
		paragraphs: 0,
		readingTime: "0 min",
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setStats(analyzeText(input));
	}, [input]);

	const handleClear = useCallback(() => {
		setInput("");
	}, []);

	const handleFileUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			if (file.size > MAX_TEXT_SIZE) {
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const text = reader.result as string;
				setInput(text);
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

		if (file.size > MAX_TEXT_SIZE) return;

		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			setInput(text);
		};
		reader.readAsText(file);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-2">
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
				<div className="ml-auto">
					<input
						ref={fileInputRef}
						type="file"
						accept=".txt,text/plain"
						onChange={handleFileUpload}
						className="hidden"
						aria-label="Upload text file"
					/>
					<Button
						size="sm"
						variant="outline"
						onClick={() => fileInputRef.current?.click()}
						className="gap-1.5"
					>
						<FileUp className="size-3.5" />
						Upload .txt
					</Button>
				</div>
			</div>

			{/* Editor area */}
			<Textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				placeholder="Type or paste your text here..."
				className="min-h-[300px] text-sm leading-relaxed resize-y"
				spellCheck={false}
				autoFocus
				aria-label="Text input"
			/>

			{/* Statistics */}
			<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
				<span>
					Characters:{" "}
					<span className="font-medium text-foreground">
						{stats.characters.toLocaleString()}
					</span>
				</span>
				<span>
					Characters (no spaces):{" "}
					<span className="font-medium text-foreground">
						{stats.charactersNoSpaces.toLocaleString()}
					</span>
				</span>
				<span>
					Words:{" "}
					<span className="font-medium text-foreground">
						{stats.words.toLocaleString()}
					</span>
				</span>
				<span>
					Sentences:{" "}
					<span className="font-medium text-foreground">
						{stats.sentences.toLocaleString()}
					</span>
				</span>
				<span>
					Paragraphs:{" "}
					<span className="font-medium text-foreground">
						{stats.paragraphs.toLocaleString()}
					</span>
				</span>
				<span>
					Reading Time:{" "}
					<span className="font-medium text-foreground">
						{stats.readingTime}
					</span>
				</span>
			</div>
		</div>
	);
}
