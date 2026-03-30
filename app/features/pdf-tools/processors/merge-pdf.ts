import { PDFDocument } from "pdf-lib";

export interface MergePdfOptions {
	signal?: AbortSignal;
}

export async function mergePdfs(
	files: File[],
	options?: MergePdfOptions,
	onProgress?: (completed: number, total: number) => void,
): Promise<Blob> {
	const signal = options?.signal;

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
	if (files.length === 0) throw new Error("No files provided");

	const mergedDoc = await PDFDocument.create();

	for (let i = 0; i < files.length; i++) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		const bytes = await files[i].arrayBuffer();

		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		let sourceDoc: PDFDocument;
		try {
			sourceDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
		} catch (err) {
			throw new Error(
				`Failed to load "${files[i].name}": ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const pages = await mergedDoc.copyPages(
			sourceDoc,
			sourceDoc.getPageIndices(),
		);
		for (const page of pages) {
			mergedDoc.addPage(page);
		}

		onProgress?.(i + 1, files.length);
	}

	const mergedBytes = await mergedDoc.save();
	return new Blob([mergedBytes as BlobPart], { type: "application/pdf" });
}

/**
 * Read the page count from a PDF file without fully parsing all pages.
 */
export async function getPdfPageCount(file: File): Promise<number> {
	const bytes = await file.arrayBuffer();
	const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	return doc.getPageCount();
}
