import { FileInput, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ToolDropzoneProps {
	accept?: Record<string, string[]>;
	multiple?: boolean;
	maxSizeMB?: number;
	onFiles: (files: File[]) => void;
	disabled?: boolean;
	children?: React.ReactNode;
}

export function ToolDropzone({
	accept,
	multiple = false,
	maxSizeMB = 500,
	onFiles,
	disabled = false,
	children,
}: ToolDropzoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const acceptExtensions = accept ? Object.values(accept).flat() : undefined;
	const acceptString = accept ? Object.keys(accept).join(",") : undefined;

	const handleFiles = useCallback(
		(fileList: FileList | null) => {
			if (!fileList || fileList.length === 0) return;
			setError(null);

			const files = Array.from(fileList);
			const maxBytes = maxSizeMB * 1024 * 1024;

			for (const file of files) {
				if (file.size > maxBytes) {
					setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
					return;
				}
			}

			onFiles(multiple ? files : [files[0]]);
		},
		[maxSizeMB, multiple, onFiles],
	);

	// Native change listener ensures programmatic file setting (e.g. Playwright's
	// setInputFiles) triggers handleFiles even when React's synthetic onChange misses it.
	useEffect(() => {
		const input = inputRef.current;
		if (!input) return;
		const onNativeChange = () => handleFiles(input.files);
		input.addEventListener("change", onNativeChange);
		input.dataset.listenerReady = "true";
		return () => {
			input.removeEventListener("change", onNativeChange);
			delete input.dataset.listenerReady;
		};
	}, [handleFiles]);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (!disabled) setIsDragging(true);
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (!disabled) handleFiles(e.dataTransfer.files);
		},
		[disabled, handleFiles],
	);

	return (
		<div className="space-y-2 h-full">
			{/* biome-ignore lint/a11y/useSemanticElements: div with role="button" needed for dropzone drag-and-drop styling */}
			<div
				role="button"
				tabIndex={0}
				onClick={() => !disabled && inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						if (!disabled) inputRef.current?.click();
					}
				}}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`
          relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer h-full
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/40"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
			>
				<input
					ref={inputRef}
					type="file"
					accept={acceptString}
					multiple={multiple}
					onChange={(e) => handleFiles(e.target.files)}
					className="hidden"
					disabled={disabled}
				/>

				{children || (
					<>
						<FileInput
							className="h-10 w-10 text-muted-foreground mb-3"
							strokeWidth={1.5}
						/>
						<p className="text-sm font-medium">
							Drop {multiple ? "files" : "a file"} here, or click to browse
						</p>
						{acceptExtensions && (
							<p className="text-xs text-muted-foreground mt-1">
								Accepted: {acceptExtensions.join(", ")}
							</p>
						)}
						<p className="text-xs text-muted-foreground mt-1">
							Max {maxSizeMB}MB per file
						</p>
						<p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
							<ShieldCheck className="h-3 w-3" />
							Private and secure — files stay with you
						</p>
					</>
				)}
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
