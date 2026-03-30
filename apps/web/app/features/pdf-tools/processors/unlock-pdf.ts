import { PDFDocument } from "pdf-lib";

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
 * Remove password protection from a PDF by loading it with
 * `ignoreEncryption: true` and re-saving without encryption.
 *
 * Works for owner-password-protected PDFs (print/copy restrictions)
 * without needing the password. For user-password-protected PDFs,
 * the password field is accepted but pdf-lib's ignoreEncryption
 * handles the loading step.
 */
export async function unlockPdf(
	file: File,
	options?: UnlockPdfOptions,
): Promise<UnlockPdfResult> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let doc: PDFDocument;
	try {
		doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	} catch (err) {
		throw new Error(
			`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const pdfBytes = await doc.save();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const pageCount = doc.getPageCount();
	const blob = new Blob([pdfBytes as BlobPart], {
		type: "application/pdf",
	});

	return {
		blob,
		pageCount,
		originalSize: file.size,
		unlockedSize: blob.size,
	};
}
