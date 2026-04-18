import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "unlock-pdf",
	name: "Unlock PDF",
	category: "pdf",
	description:
		"Remove password protection from a PDF by re-saving it without encryption.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "password",
			type: "string",
			description: "PDF password (required for user-password-protected files)",
			default: "",
		},
	],
	execute: async (input, _options, context) => {
		const { PDFDocument } = await import("pdf-lib");

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, { ignoreEncryption: true });
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		context.onProgress?.(50);

		// Strip the /Encrypt dictionary so the saved PDF has no encryption.
		// pdf-lib's ignoreEncryption only skips validation during load — it
		// preserves the encryption metadata in the document context, so a
		// subsequent doc.save() would re-serialize it and produce a still-
		// locked PDF. Deleting the trailer Encrypt entry forces unencrypted
		// output.
		delete doc.context.trailerInfo.Encrypt;

		const pdfBytes = await doc.save();

		context.onProgress?.(100);

		return {
			output: new Uint8Array(pdfBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				pageCount: doc.getPageCount(),
			},
		};
	},
};

registerTool(tool);
export default tool;
