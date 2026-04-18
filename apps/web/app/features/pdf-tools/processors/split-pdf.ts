// Register this tool's ToolDefinition with the core registry. Required
// because core's main entry no longer eagerly loads every tool —
// @nouploads/core/tools/split-pdf self-registers on import.
import "@nouploads/core/tools/split-pdf";
import { getTool, isToolResultMulti } from "@nouploads/core";
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
 *
 * Kept in the web layer for input validation + immediate UI feedback before
 * the split runs. Core has its own internal parser for execution; the
 * results match.
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
 * Delegates to @nouploads/core's split-pdf tool. The core tool returns
 * either ToolResult (single range) or ToolResultMulti (N ranges); this
 * adapter normalizes both into SplitResult[] that the web component
 * consumes.
 */
export async function splitPdf(
	file: File,
	options?: SplitPdfOptions,
	onProgress?: (completed: number, total: number) => void,
): Promise<SplitResult[]> {
	const signal = options?.signal;
	const rangesStr = options?.ranges?.trim() ?? "";

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("split-pdf");
	if (!tool) throw new Error("split-pdf tool not found in core registry");

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const baseName = file.name.replace(/\.pdf$/i, "");

	// Read total pages once so we can build the parsed-ranges list (with
	// labels) up-front, matching the same expansion core does internally.
	// This keeps progress reporting accurate and lets us label outputs
	// without parsing core's filenames back.
	let srcDoc: PDFDocument;
	try {
		srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	} catch {
		throw new Error(
			"Failed to load PDF: the file may be corrupted or password-protected",
		);
	}
	const totalPages = srcDoc.getPageCount();

	const parsedRanges = rangesStr
		? parsePageRanges(rangesStr, totalPages)
		: Array.from({ length: totalPages }, (_, i) => ({
				indices: [i],
				label: `Page ${i + 1}`,
			}));

	if (parsedRanges.length === 0) {
		throw new Error("No valid page ranges specified");
	}

	const result = await tool.execute(
		bytes,
		{ ranges: rangesStr },
		{
			signal,
			onProgress: (pct) => {
				const completed = Math.round((pct / 100) * parsedRanges.length);
				onProgress?.(completed, parsedRanges.length);
			},
		},
	);

	if (isToolResultMulti(result)) {
		return result.outputs.map((out, i) => {
			const range = parsedRanges[i];
			return {
				blob: new Blob([out.bytes as BlobPart], { type: out.mimeType }),
				label: range.label,
				filename: `${baseName}-${out.filename}`,
				pageCount: range.indices.length,
			};
		});
	}

	// Single range: core returned ToolResult. Match the original web semantics
	// (single range → no suffix in filename, regardless of whether the range
	// was specified explicitly or implied by an empty rangesStr).
	const range = parsedRanges[0];
	return [
		{
			blob: new Blob([result.output as BlobPart], { type: result.mimeType }),
			label: range.label,
			filename: `${baseName}.pdf`,
			pageCount: range.indices.length,
		},
	];
}

/**
 * Read the page count from a PDF file.
 */
export async function getPdfPageCount(file: File): Promise<number> {
	const bytes = await file.arrayBuffer();
	const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
	return doc.getPageCount();
}
