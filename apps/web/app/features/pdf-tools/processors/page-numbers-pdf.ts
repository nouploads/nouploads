import { getTool } from "@nouploads/core";

export interface PageNumbersPdfOptions {
	position?: string;
	format?: string;
	fontSize?: number;
	startNumber?: number;
	margin?: number;
	skipFirst?: boolean;
	signal?: AbortSignal;
}

export interface PageNumbersPdfResult {
	blob: Blob;
	pageCount: number;
	originalSize: number;
	numberedSize: number;
}

export async function pageNumbersPdf(
	file: File,
	options?: PageNumbersPdfOptions,
	onProgress?: (page: number, total: number) => void,
): Promise<PageNumbersPdfResult> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("page-numbers-pdf");
	if (!tool)
		throw new Error("page-numbers-pdf tool not found in core registry");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const executePromise = tool.execute(
		bytes,
		{
			position: options?.position ?? "bottom-center",
			format: options?.format ?? "number",
			fontSize: options?.fontSize ?? 12,
			startNumber: options?.startNumber ?? 1,
			margin: options?.margin ?? 40,
			skipFirst: options?.skipFirst ?? false,
		},
		{
			onProgress: (pct) => {
				onProgress?.(Math.round(pct / 10), 10);
			},
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

	const blob = new Blob([result.output as BlobPart], {
		type: "application/pdf",
	});
	const pageCount = (result.metadata?.pageCount as number) ?? 0;

	return {
		blob,
		pageCount,
		originalSize: file.size,
		numberedSize: blob.size,
	};
}
