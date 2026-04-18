import { getTool, isToolResultMulti } from "@nouploads/core";

export interface ProtectPdfOptions {
	userPassword?: string;
	ownerPassword?: string;
	allowPrinting?: boolean;
	allowCopying?: boolean;
	allowEditing?: boolean;
	signal?: AbortSignal;
}

export interface ProtectPdfResult {
	blob: Blob;
	pageCount: number;
	originalSize: number;
	protectedSize: number;
}

/**
 * Add password protection (RC4-128) and permission restrictions to a PDF.
 * Delegates to @nouploads/core's protect-pdf tool which implements the PDF
 * Standard Security Handler (V=2, R=3) per PDF spec §7.6.3.
 */
export async function protectPdf(
	file: File,
	options?: ProtectPdfOptions,
	onProgress?: (percent: number) => void,
): Promise<ProtectPdfResult> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("protect-pdf");
	if (!tool) throw new Error("protect-pdf tool not found in core registry");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const result = await tool.execute(
		bytes,
		{
			userPassword: options?.userPassword ?? "",
			ownerPassword: options?.ownerPassword ?? "",
			allowPrinting: options?.allowPrinting ?? true,
			allowCopying: options?.allowCopying ?? true,
			allowEditing: options?.allowEditing ?? true,
		},
		{
			signal,
			onProgress: (pct) => onProgress?.(pct),
		},
	);

	if (isToolResultMulti(result)) {
		throw new Error("protect-pdf unexpectedly returned multiple outputs");
	}

	const blob = new Blob([result.output as BlobPart], {
		type: "application/pdf",
	});
	const pageCount = (result.metadata?.pageCount as number) ?? 0;

	return {
		blob,
		pageCount,
		originalSize: file.size,
		protectedSize: blob.size,
	};
}
