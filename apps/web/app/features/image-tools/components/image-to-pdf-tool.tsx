import { ArrowDown, ArrowUp, FileImage, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { ToolProgress } from "~/components/tool/tool-progress";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import type { ImageToPdfOptions } from "~/features/image-tools/processors/image-to-pdf";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

type PageSize = NonNullable<ImageToPdfOptions["pageSize"]>;

function generateOutputFilename(files: File[]): string {
	if (files.length === 1) {
		return files[0].name.replace(/\.[^.]+$/, ".pdf");
	}
	return "images.pdf";
}

export default function ImageToPdfTool() {
	const [files, setFiles] = useState<File[]>([]);
	const [pageSize, setPageSize] = useState<PageSize>("fit");
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState({ completed: 0, total: 0 });
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [thumbnails, setThumbnails] = useState<Map<File, string>>(new Map());
	const abortRef = useRef<AbortController | null>(null);
	const addInputRef = useRef<HTMLInputElement>(null);

	const handleFiles = useCallback((incoming: File[]) => {
		setFiles((prev) => [...prev, ...incoming]);
		setResultBlob(null);
		setError(null);

		// Generate thumbnails for new files
		for (const file of incoming) {
			const url = URL.createObjectURL(file);
			setThumbnails((prev) => new Map(prev).set(file, url));
		}
	}, []);

	const removeFile = useCallback(
		(index: number) => {
			setFiles((prev) => {
				const file = prev[index];
				const thumb = thumbnails.get(file);
				if (thumb) URL.revokeObjectURL(thumb);
				setThumbnails((t) => {
					const next = new Map(t);
					next.delete(file);
					return next;
				});
				return prev.filter((_, i) => i !== index);
			});
			setResultBlob(null);
			setError(null);
		},
		[thumbnails],
	);

	const moveUp = useCallback((index: number) => {
		if (index === 0) return;
		setFiles((prev) => {
			const next = [...prev];
			[next[index - 1], next[index]] = [next[index], next[index - 1]];
			return next;
		});
		setResultBlob(null);
	}, []);

	const moveDown = useCallback((index: number) => {
		setFiles((prev) => {
			if (index >= prev.length - 1) return prev;
			const next = [...prev];
			[next[index], next[index + 1]] = [next[index + 1], next[index]];
			return next;
		});
		setResultBlob(null);
	}, []);

	const reset = useCallback(() => {
		abortRef.current?.abort();
		for (const url of thumbnails.values()) {
			URL.revokeObjectURL(url);
		}
		setFiles([]);
		setThumbnails(new Map());
		setResultBlob(null);
		setError(null);
		setProcessing(false);
	}, [thumbnails]);

	const createPdf = useCallback(async () => {
		if (files.length === 0) return;

		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setProcessing(true);
		setError(null);
		setResultBlob(null);
		setProgress({ completed: 0, total: files.length });

		try {
			const { imagesToPdf } = await import(
				"~/features/image-tools/processors/image-to-pdf"
			);

			if (controller.signal.aborted) return;

			const blob = await imagesToPdf(
				files,
				{ pageSize, signal: controller.signal },
				(completed, total) => {
					if (controller.signal.aborted) return;
					setProgress({ completed, total });
				},
			);

			if (controller.signal.aborted) return;
			setResultBlob(blob);
			setProcessing(false);
		} catch (err) {
			if (controller.signal.aborted) return;
			setError(err instanceof Error ? err.message : "Failed to create PDF");
			setProcessing(false);
		}
	}, [files, pageSize]);

	const outputFilename = generateOutputFilename(files);

	// Accept string for the hidden "add more" input
	const acceptString = Object.keys(ACCEPT_IMAGES).join(",");

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<span className="text-sm font-medium">Page Size</span>
				<Select
					value={pageSize}
					onValueChange={(v) => {
						setPageSize(v as PageSize);
						setResultBlob(null);
					}}
				>
					<SelectTrigger aria-label="Page size">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="fit">Fit to Image</SelectItem>
						<SelectItem value="a4">A4</SelectItem>
						<SelectItem value="letter">Letter</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="min-h-[460px]">
				{files.length === 0 && (
					<div className="h-[460px]">
						<ToolDropzone
							accept={ACCEPT_IMAGES}
							onFiles={handleFiles}
							multiple
						/>
					</div>
				)}

				{files.length > 0 && (
					<div className="space-y-4">
						<div className="space-y-2">
							{files.map((file, index) => (
								<div
									key={`${file.name}-${file.size}-${file.lastModified}`}
									className="flex items-center gap-3 rounded-lg border bg-card p-3"
								>
									<div className="shrink-0 size-10 rounded overflow-hidden bg-muted flex items-center justify-center">
										{thumbnails.get(file) ? (
											<img
												src={thumbnails.get(file)}
												alt={file.name}
												className="size-10 object-cover"
											/>
										) : (
											<FileImage className="size-4 text-muted-foreground" />
										)}
									</div>

									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium truncate">{file.name}</p>
										<p className="text-xs text-muted-foreground">
											{formatFileSize(file.size)}
										</p>
									</div>

									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => moveUp(index)}
											disabled={index === 0}
											aria-label={`Move ${file.name} up`}
										>
											<ArrowUp className="size-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => moveDown(index)}
											disabled={index === files.length - 1}
											aria-label={`Move ${file.name} down`}
										>
											<ArrowDown className="size-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={() => removeFile(index)}
											aria-label={`Remove ${file.name}`}
										>
											<Trash2 className="size-3" />
										</Button>
									</div>
								</div>
							))}
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => addInputRef.current?.click()}
								className="gap-1.5"
							>
								<Plus className="size-3.5" />
								Add more files
							</Button>
							<input
								ref={addInputRef}
								type="file"
								accept={acceptString}
								multiple
								onChange={(e) => {
									if (e.target.files && e.target.files.length > 0) {
										handleFiles(Array.from(e.target.files));
									}
									e.target.value = "";
								}}
								className="hidden"
							/>
						</div>

						{processing && (
							<ToolProgress
								value={(progress.completed / progress.total) * 100}
								message={`Processing ${progress.completed} of ${progress.total} images...`}
							/>
						)}

						{error && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
								<p className="text-sm text-destructive">{error}</p>
							</div>
						)}

						<div className="flex items-center gap-3">
							{!processing && !resultBlob && (
								<Button onClick={createPdf} className="gap-2">
									<FileImage className="size-4" />
									Create PDF
								</Button>
							)}

							{processing && (
								<Button disabled className="gap-2">
									<Spinner className="size-4" />
									Creating PDF...
								</Button>
							)}

							{resultBlob && !processing && (
								<DownloadButton blob={resultBlob} filename={outputFilename} />
							)}

							<Button variant="outline" onClick={reset}>
								Start over
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
