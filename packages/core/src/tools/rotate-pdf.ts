import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "rotate-pdf",
	name: "Rotate PDF",
	category: "pdf",
	description:
		"Rotate individual pages or all pages of a PDF by 90, 180, or 270 degrees.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "rotation",
			type: "number",
			description: "Rotation angle in degrees clockwise (90, 180, or 270)",
			default: 90,
			choices: ["90", "180", "270"],
		},
	],
	execute: async (input, options, context) => {
		const { PDFDocument, degrees } = await import("pdf-lib");

		const rotation = Number(options.rotation ?? 90);
		if (![90, 180, 270].includes(rotation)) {
			throw new Error(
				`Invalid rotation angle: ${rotation}. Must be 90, 180, or 270.`,
			);
		}

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, { ignoreEncryption: true });
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const pages = doc.getPages();
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			const currentRotation = page.getRotation().angle;
			const newRotation = (currentRotation + rotation) % 360;
			page.setRotation(degrees(newRotation));

			context.onProgress?.(Math.round(((i + 1) / pages.length) * 100));
		}

		const pdfBytes = await doc.save();
		return {
			output: new Uint8Array(pdfBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				pageCount: pages.length,
				rotation,
			},
		};
	},
};

registerTool(tool);
export default tool;
