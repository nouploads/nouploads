import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "merge-pdf",
	name: "Merge PDFs",
	category: "pdf",
	description: "Combine multiple PDF files into a single document.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [],
	execute: async () => {
		throw new Error(
			"merge-pdf requires multiple input files. Use executeMulti instead.",
		);
	},
	executeMulti: async (inputs, _options, context) => {
		const { PDFDocument } = await import("pdf-lib");

		if (inputs.length === 0) throw new Error("No files provided");
		if (inputs.length === 1)
			throw new Error("At least 2 PDF files are required for merging");

		const mergedDoc = await PDFDocument.create();

		for (let i = 0; i < inputs.length; i++) {
			let sourceDoc: import("pdf-lib").PDFDocument;
			try {
				sourceDoc = await PDFDocument.load(inputs[i], {
					ignoreEncryption: true,
				});
			} catch (err) {
				throw new Error(
					`Failed to load PDF file ${i + 1}: ${err instanceof Error ? err.message : "Invalid PDF"}`,
				);
			}

			const pages = await mergedDoc.copyPages(
				sourceDoc,
				sourceDoc.getPageIndices(),
			);
			for (const page of pages) {
				mergedDoc.addPage(page);
			}

			context.onProgress?.(Math.round(((i + 1) / inputs.length) * 100));
		}

		const mergedBytes = await mergedDoc.save();
		return {
			output: new Uint8Array(mergedBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				inputCount: inputs.length,
				pageCount: mergedDoc.getPageCount(),
			},
		};
	},
};

registerTool(tool);
export default tool;
