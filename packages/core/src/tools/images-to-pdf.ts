/**
 * Combine multiple images into a single PDF document.
 * Uses pdf-lib for PDF creation and imageBackend for format conversion.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const PAGE_SIZES = {
	a4: { width: 595.28, height: 841.89 },
	letter: { width: 612, height: 792 },
} as const;

const MARGIN = 36; // 0.5 inch margin for fixed-size pages

/** Detect if bytes are JPG or PNG by magic bytes */
function detectImageType(bytes: Uint8Array): "jpg" | "png" | "unknown" {
	if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47
	)
		return "png";
	return "unknown";
}

const tool: ToolDefinition = {
	id: "images-to-pdf",
	name: "Images to PDF",
	category: "image",
	description:
		"Combine multiple images into a single PDF document. Each image becomes one page.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"image/avif",
	],
	inputExtensions: [
		".jpg",
		".jpeg",
		".png",
		".webp",
		".gif",
		".bmp",
		".tiff",
		".tif",
		".avif",
	],
	options: [
		{
			name: "pageSize",
			type: "string",
			description: "Page size: fit (match image), a4, or letter",
			default: "fit",
			choices: ["fit", "a4", "letter"],
		},
	],
	execute: async () => {
		throw new Error(
			"images-to-pdf requires multiple input files. Use executeMulti instead.",
		);
	},
	executeMulti: async (inputs, options, context) => {
		const { PDFDocument } = await import("pdf-lib");

		if (inputs.length === 0) throw new Error("No images provided");

		const pageSize = (options.pageSize as "fit" | "a4" | "letter") ?? "fit";
		const pdfDoc = await PDFDocument.create();

		for (let i = 0; i < inputs.length; i++) {
			let bytes = inputs[i];
			let type = detectImageType(bytes);

			// pdf-lib only supports embedding JPG and PNG directly.
			// Convert other formats to PNG via imageBackend.
			if (type === "unknown" && context.imageBackend) {
				const decoded = await context.imageBackend.decode(bytes, "auto");
				bytes = await context.imageBackend.encode(decoded, {
					format: "png",
				});
				type = "png";
			} else if (type === "unknown") {
				throw new Error(
					`Image ${i + 1} is not JPG or PNG, and no image backend is available for conversion`,
				);
			}

			const embeddedImage =
				type === "jpg"
					? await pdfDoc.embedJpg(bytes)
					: await pdfDoc.embedPng(bytes);

			const imgWidth = embeddedImage.width;
			const imgHeight = embeddedImage.height;

			let pageWidth: number;
			let pageHeight: number;
			let drawX: number;
			let drawY: number;
			let drawWidth: number;
			let drawHeight: number;

			if (pageSize === "fit") {
				pageWidth = imgWidth;
				pageHeight = imgHeight;
				drawX = 0;
				drawY = 0;
				drawWidth = imgWidth;
				drawHeight = imgHeight;
			} else {
				const dimensions = PAGE_SIZES[pageSize];
				pageWidth = dimensions.width;
				pageHeight = dimensions.height;

				const availableWidth = pageWidth - 2 * MARGIN;
				const availableHeight = pageHeight - 2 * MARGIN;

				const scale = Math.min(
					availableWidth / imgWidth,
					availableHeight / imgHeight,
					1,
				);

				drawWidth = imgWidth * scale;
				drawHeight = imgHeight * scale;
				drawX = (pageWidth - drawWidth) / 2;
				drawY = (pageHeight - drawHeight) / 2;
			}

			const page = pdfDoc.addPage([pageWidth, pageHeight]);
			page.drawImage(embeddedImage, {
				x: drawX,
				y: drawY,
				width: drawWidth,
				height: drawHeight,
			});

			context.onProgress?.(Math.round(((i + 1) / inputs.length) * 100));
		}

		const pdfBytes = await pdfDoc.save();
		return {
			output: new Uint8Array(pdfBytes),
			extension: ".pdf",
			mimeType: "application/pdf",
			metadata: {
				pageCount: pdfDoc.getPageCount(),
				inputCount: inputs.length,
			},
		};
	},
};

registerTool(tool);
export default tool;
