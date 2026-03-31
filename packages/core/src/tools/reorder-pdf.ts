import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "reorder-pdf",
	name: "PDF Page Reorder",
	category: "pdf",
	description: "Reorder, rearrange, and remove pages from a PDF document.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "order",
			type: "string",
			description:
				"Comma-separated page numbers in desired order, e.g. '3,1,2,5,4'",
			default: "",
		},
	],
	execute: async (input, options, context) => {
		const { PDFDocument } = await import("pdf-lib");

		const orderStr = String(options.order ?? "").trim();

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, { ignoreEncryption: true });
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const totalPages = doc.getPageCount();
		if (totalPages === 0) throw new Error("PDF has no pages");

		// Parse the order string into 0-based indices
		let pageIndices: number[];
		if (!orderStr) {
			// No reorder specified — return as-is
			pageIndices = Array.from({ length: totalPages }, (_, i) => i);
		} else {
			pageIndices = orderStr.split(",").map((s) => {
				const n = Number.parseInt(s.trim(), 10);
				if (Number.isNaN(n) || n < 1) {
					throw new Error(
						`Invalid page number "${s.trim()}": must be a positive integer`,
					);
				}
				if (n > totalPages) {
					throw new Error(
						`Invalid page number ${n}: PDF only has ${totalPages} pages`,
					);
				}
				return n - 1; // Convert to 0-based
			});
		}

		if (pageIndices.length === 0) {
			throw new Error("Page order cannot be empty");
		}

		const newDoc = await PDFDocument.create();
		for (let i = 0; i < pageIndices.length; i++) {
			const [copied] = await newDoc.copyPages(doc, [pageIndices[i]]);
			newDoc.addPage(copied);
			context.onProgress?.(Math.round(((i + 1) / pageIndices.length) * 100));
		}

		const pdfBytes = await newDoc.save();
		return {
			output: new Uint8Array(pdfBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				pageCount: pageIndices.length,
				originalPageCount: totalPages,
			},
		};
	},
};

registerTool(tool);
export default tool;
