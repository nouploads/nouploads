import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "split-pdf",
	name: "Split PDF",
	category: "pdf",
	description: "Split a PDF into individual pages or custom page ranges.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "ranges",
			type: "string",
			description:
				'Comma-separated page ranges (e.g. "1-3, 5, 7-10"). Leave empty to split into individual pages.',
			default: "",
		},
	],
	execute: async (input, options, context) => {
		const { PDFDocument } = await import("pdf-lib");

		if (input.length === 0) throw new Error("No file provided");

		let sourceDoc: import("pdf-lib").PDFDocument;
		try {
			sourceDoc = await PDFDocument.load(input, { ignoreEncryption: true });
		} catch {
			throw new Error("Failed to load PDF: the file may be corrupted");
		}

		const totalPages = sourceDoc.getPageCount();
		if (totalPages === 0) throw new Error("PDF has no pages");

		const rangesStr =
			typeof options.ranges === "string" ? options.ranges.trim() : "";

		const ranges = rangesStr
			? parsePageRanges(rangesStr, totalPages)
			: Array.from({ length: totalPages }, (_, i) => [i]);

		if (ranges.length === 0) throw new Error("No valid page ranges specified");

		// Single range: return one ToolResult.
		if (ranges.length === 1) {
			const newDoc = await PDFDocument.create();
			const pages = await newDoc.copyPages(sourceDoc, ranges[0]);
			for (const page of pages) {
				newDoc.addPage(page);
			}
			const bytes = await newDoc.save();
			context.onProgress?.(100);
			return {
				output: new Uint8Array(bytes),
				extension: ".pdf",
				mimeType: "application/pdf",
				metadata: { pageCount: pages.length, rangeCount: 1, totalPages },
			};
		}

		// Multiple ranges: return one PDF per range as ToolResultMulti.
		const outputs: { bytes: Uint8Array; filename: string; mimeType: string }[] =
			[];
		for (let i = 0; i < ranges.length; i++) {
			if (context.signal?.aborted) {
				throw new DOMException("Aborted", "AbortError");
			}

			const range = ranges[i];
			const newDoc = await PDFDocument.create();
			const pages = await newDoc.copyPages(sourceDoc, range);
			for (const page of pages) {
				newDoc.addPage(page);
			}
			const bytes = await newDoc.save();

			const label =
				range.length === 1
					? `page-${range[0] + 1}`
					: `pages-${range[0] + 1}-${range[range.length - 1] + 1}`;

			outputs.push({
				bytes: new Uint8Array(bytes),
				filename: `${label}.pdf`,
				mimeType: "application/pdf",
			});

			context.onProgress?.(Math.round(((i + 1) / ranges.length) * 100));
		}

		return {
			outputs,
			metadata: { rangeCount: ranges.length, totalPages },
		};
	},
};

/**
 * Parse a range string like "1-3, 5, 7-10" into arrays of 0-based page indices.
 * Each range element becomes a separate array.
 */
export function parsePageRanges(
	rangesStr: string,
	totalPages: number,
): number[][] {
	const result: number[][] = [];
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
				indices.push(i - 1); // Convert to 0-based
			}
			result.push(indices);
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
			result.push([pageNum - 1]);
		}
	}

	return result;
}

registerTool(tool);
export default tool;
