import { PDFDocument } from "pdf-lib";

export interface ReorderPdfResult {
	blob: Blob;
	pageCount: number;
	originalPageCount: number;
}

/**
 * Reorder pages of a PDF according to the given 0-based page indices.
 * Pages not included in the order array are effectively removed.
 */
export async function reorderPdf(
	input: Uint8Array,
	pageOrder: number[],
	signal?: AbortSignal,
): Promise<Uint8Array> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let srcDoc: PDFDocument;
	try {
		srcDoc = await PDFDocument.load(input, { ignoreEncryption: true });
	} catch {
		throw new Error(
			"Failed to load PDF: the file may be corrupted or password-protected",
		);
	}

	const totalPages = srcDoc.getPageCount();
	if (totalPages === 0) throw new Error("PDF has no pages");

	if (pageOrder.length === 0) throw new Error("Page order cannot be empty");

	// Validate all indices
	for (const idx of pageOrder) {
		if (idx < 0 || idx >= totalPages) {
			throw new Error(
				`Invalid page index ${idx}: PDF has ${totalPages} pages (0-${totalPages - 1})`,
			);
		}
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const newDoc = await PDFDocument.create();
	for (const pageIdx of pageOrder) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
		const [copied] = await newDoc.copyPages(srcDoc, [pageIdx]);
		newDoc.addPage(copied);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const pdfBytes = await newDoc.save();
	return new Uint8Array(pdfBytes);
}

/**
 * Remove specific pages from a PDF.
 * pagesToRemove are 0-based indices.
 */
export async function removePdfPages(
	input: Uint8Array,
	pagesToRemove: number[],
	signal?: AbortSignal,
): Promise<Uint8Array> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let srcDoc: PDFDocument;
	try {
		srcDoc = await PDFDocument.load(input, { ignoreEncryption: true });
	} catch {
		throw new Error(
			"Failed to load PDF: the file may be corrupted or password-protected",
		);
	}

	const totalPages = srcDoc.getPageCount();
	const removeSet = new Set(pagesToRemove);
	const keepIndices: number[] = [];

	for (let i = 0; i < totalPages; i++) {
		if (!removeSet.has(i)) {
			keepIndices.push(i);
		}
	}

	if (keepIndices.length === 0) {
		throw new Error("Cannot remove all pages from a PDF");
	}

	return reorderPdf(input, keepIndices, signal);
}

/**
 * Read the page count from a PDF file.
 */
export async function getPdfPageCount(input: Uint8Array): Promise<number> {
	const doc = await PDFDocument.load(input, { ignoreEncryption: true });
	return doc.getPageCount();
}
