import { PDFDocument } from "pdf-lib";

export interface SplitPdfOptions {
	/** Comma-separated ranges like "1-3, 5, 7-10". Empty = individual pages. */
	ranges?: string;
	signal?: AbortSignal;
}

export interface SplitResult {
	/** The split PDF blob */
	blob: Blob;
	/** Label for this part (e.g. "Pages 1-3" or "Page 5") */
	label: string;
	/** Suggested filename */
	filename: string;
	/** Number of pages in this part */
	pageCount: number;
}

/**
 * Parse a range string like "1-3, 5, 7-10" into arrays of 0-based page indices.
 * Each comma-separated element becomes a separate range.
 */
export function parsePageRanges(
	rangesStr: string,
	totalPages: number,
): { indices: number[]; label: string }[] {
	const result: { indices: number[]; label: string }[] = [];
	const parts = rangesStr.split(",").map((s) => s.trim());

	for (const part of parts) {
		if (!part) continue;

		const dashMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
		if (dashMatch) {
			const start = Number.parseInt(dashMatch[1], 10);
			const end = Number.parseInt(dashMatch[2], 10);
			if (start < 1 || end < 1) {
				throw new Error(`Invalid range "${part}": page numbers start at 1`);
			}
			if (start > totalPages || end > totalPages) {
				throw new Error(
					`Invalid range "${part}": PDF only has ${totalPages} pages`,
				);
			}
			if (start > end) {
				throw new Error(
					`Invalid range "${part}": start page cannot be after end page`,
				);
			}
			const indices: number[] = [];
			for (let i = start; i <= end; i++) {
				indices.push(i - 1);
			}
			result.push({
				indices,
				label: start === end ? `Page ${start}` : `Pages ${start}-${end}`,
			});
		} else {
			const pageNum = Number.parseInt(part, 10);
			if (Number.isNaN(pageNum) || pageNum < 1) {
				throw new Error(
					`Invalid page number "${part}": must be a positive integer`,
				);
			}
			if (pageNum > totalPages) {
				throw new Error(
					`Invalid page number "${part}": PDF only has ${totalPages} pages`,
				);
			}
			result.push({ indices: [pageNum - 1], label: `Page ${pageNum}` });
		}
	}

	return result;
}

/**
 * Split a PDF file into parts based on page ranges.
 *
 * If no ranges are specified, splits into individual pages.
 * Uses pdf-lib's copyPages to extract page subsets without re-rendering.
 */
export async function splitPdf(
	file: File,
	options?: SplitPdfOptions,
	onProgress?: (completed: number, total: number) => void,
): Promise<SplitResult[]> {
	const signal = options?.signal;
	const rangesStr = options?.ranges?.trim() ?? "";

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const arrayBuffer = await file.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	let sourceDoc: PDFDocument;
	try {
		sourceDoc = await PDFDocument.load(arrayBuffer, {
			ignoreEncryption: true,
		});
	} catch {
		throw new Error(
			"Failed to load PDF: the file may be corrupted or password-protected",
		);
	}

	const totalPages = sourceDoc.getPageCount();
	if (totalPages === 0) throw new Error("PDF has no pages");

	// Build range list
	const ranges = rangesStr
		? parsePageRanges(rangesStr, totalPages)
		: Array.from({ length: totalPages }, (_, i) => ({
				indices: [i],
				label: `Page ${i + 1}`,
			}));

	if (ranges.length === 0) throw new Error("No valid page ranges specified");

	const baseName = file.name.replace(/\.pdf$/i, "");
	const results: SplitResult[] = [];

	for (let i = 0; i < ranges.length; i++) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		const range = ranges[i];
		const newDoc = await PDFDocument.create();
		const pages = await newDoc.copyPages(sourceDoc, range.indices);
		for (const page of pages) {
			newDoc.addPage(page);
		}

		const bytes = await newDoc.save();
		const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });

		// Build filename
		const suffix =
			ranges.length === 1
				? ""
				: `-${range.label.toLowerCase().replace(/\s+/g, "-")}`;
		const filename = `${baseName}${suffix}.pdf`;

		results.push({
			blob,
			label: range.label,
			filename,
			pageCount: range.indices.length,
		});

		onProgress?.(i + 1, ranges.length);
	}

	return results;
}

/**
 * Read the page count from a PDF file.
 */
export async function getPdfPageCount(file: File): Promise<number> {
	const bytes = await file.arrayBuffer();
	const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	return doc.getPageCount();
}
