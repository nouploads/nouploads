// Register this tool's ToolDefinition with the core registry. Required
// because core's main entry no longer eagerly loads every tool —
// @nouploads/core/tools/watermark-pdf self-registers on import.
import "@nouploads/core/tools/watermark-pdf";
import { getTool, isToolResultMulti } from "@nouploads/core";

export interface WatermarkPdfOptions {
	text?: string;
	fontSize?: number;
	opacity?: number;
	rotation?: number;
	color?: string;
	signal?: AbortSignal;
}

export interface WatermarkPdfResult {
	blob: Blob;
	pageCount: number;
	originalSize: number;
	watermarkedSize: number;
}

export async function watermarkPdf(
	file: File,
	options?: WatermarkPdfOptions,
	onProgress?: (page: number, total: number) => void,
): Promise<WatermarkPdfResult> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("watermark-pdf");
	if (!tool) throw new Error("watermark-pdf tool not found in core registry");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const executePromise = tool.execute(
		bytes,
		{
			text: options?.text ?? "CONFIDENTIAL",
			fontSize: options?.fontSize ?? 60,
			opacity: options?.opacity ?? 0.3,
			rotation: options?.rotation ?? 45,
			color: options?.color ?? "#808080",
		},
		{
			onProgress: (pct) => {
				onProgress?.(Math.round(pct / 10), 10);
			},
			signal,
		},
	);

	let result: Awaited<typeof executePromise>;
	if (signal) {
		result = await Promise.race([
			executePromise,
			new Promise<never>((_, reject) => {
				if (signal.aborted) reject(new DOMException("Aborted", "AbortError"));
				signal.addEventListener(
					"abort",
					() => reject(new DOMException("Aborted", "AbortError")),
					{ once: true },
				);
			}),
		]);
	} else {
		result = await executePromise;
	}

	if (isToolResultMulti(result)) {
		throw new Error("watermark-pdf unexpectedly returned multiple outputs");
	}

	const blob = new Blob([result.output as BlobPart], {
		type: "application/pdf",
	});
	const pageCount = (result.metadata?.pageCount as number) ?? 0;

	return {
		blob,
		pageCount,
		originalSize: file.size,
		watermarkedSize: blob.size,
	};
}
