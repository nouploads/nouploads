import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "watermark-pdf",
	name: "Watermark PDF",
	category: "pdf",
	description: "Add a text watermark to every page of a PDF.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "text",
			type: "string",
			description: "Watermark text",
			default: "CONFIDENTIAL",
		},
		{
			name: "fontSize",
			type: "number",
			description: "Font size",
			default: 60,
			min: 20,
			max: 120,
		},
		{
			name: "opacity",
			type: "number",
			description: "Watermark opacity",
			default: 0.3,
			min: 0.1,
			max: 1.0,
		},
		{
			name: "rotation",
			type: "number",
			description: "Rotation angle in degrees",
			default: 45,
			min: -90,
			max: 90,
		},
		{
			name: "color",
			type: "string",
			description: "Watermark color (hex)",
			default: "#808080",
		},
	],
	execute: async (input, options, context) => {
		const { PDFDocument, StandardFonts, degrees, rgb } = await import(
			"pdf-lib"
		);

		const text = (options.text as string) || "CONFIDENTIAL";
		const fontSize = (options.fontSize as number) || 60;
		const opacity = (options.opacity as number) ?? 0.3;
		const rotation = (options.rotation as number) ?? 45;
		const colorHex = (options.color as string) || "#808080";

		// Parse hex color to rgb
		const r = Number.parseInt(colorHex.slice(1, 3), 16) / 255;
		const g = Number.parseInt(colorHex.slice(3, 5), 16) / 255;
		const b = Number.parseInt(colorHex.slice(5, 7), 16) / 255;

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, { ignoreEncryption: true });
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const font = await doc.embedFont(StandardFonts.Helvetica);
		const pages = doc.getPages();

		for (let i = 0; i < pages.length; i++) {
			const page = pages[i];
			const { width, height } = page.getSize();

			const textWidth = font.widthOfTextAtSize(text, fontSize);
			const textHeight = font.heightAtSize(fontSize);
			const x = (width - textWidth) / 2;
			const y = (height - textHeight) / 2;

			page.drawText(text, {
				x,
				y,
				font,
				size: fontSize,
				color: rgb(r, g, b),
				opacity,
				rotate: degrees(rotation),
			});

			context.onProgress?.(Math.round(((i + 1) / pages.length) * 100));
		}

		const pdfBytes = await doc.save();
		return {
			output: new Uint8Array(pdfBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				pageCount: pages.length,
				watermarkText: text,
			},
		};
	},
};

registerTool(tool);
export default tool;
