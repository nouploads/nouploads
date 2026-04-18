// Register this tool's ToolDefinition with the core registry. Required
// because core's main entry no longer eagerly loads every tool —
// @nouploads/core/tools/unlock-pdf self-registers on import.
import "@nouploads/core/tools/unlock-pdf";
import { getTool, isToolResultMulti } from "@nouploads/core";

export interface UnlockPdfOptions {
	password?: string;
	signal?: AbortSignal;
}

export interface UnlockPdfResult {
	blob: Blob;
	pageCount: number;
	originalSize: number;
	unlockedSize: number;
}

/**
 * Remove password protection from a PDF by re-saving it without the
 * /Encrypt trailer dictionary. Delegates to @nouploads/core's unlock-pdf.
 *
 * Works for owner-password-protected PDFs (print/copy restrictions) without
 * needing the password. For user-password-protected PDFs, the password
 * field is accepted but pdf-lib's ignoreEncryption handles loading.
 */
export async function unlockPdf(
	file: File,
	options?: UnlockPdfOptions,
): Promise<UnlockPdfResult> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("unlock-pdf");
	if (!tool) throw new Error("unlock-pdf tool not found in core registry");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const result = await tool.execute(
		bytes,
		{ password: options?.password ?? "" },
		{ signal },
	);

	if (isToolResultMulti(result)) {
		throw new Error("unlock-pdf unexpectedly returned multiple outputs");
	}

	const pageCount = (result.metadata?.pageCount as number) ?? 0;
	const blob = new Blob([result.output as BlobPart], {
		type: "application/pdf",
	});

	return {
		blob,
		pageCount,
		originalSize: file.size,
		unlockedSize: blob.size,
	};
}
