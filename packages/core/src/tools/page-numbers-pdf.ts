import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/** Convert a number to lowercase Roman numerals. */
function toRoman(num: number): string {
	const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
	const syms = [
		"m",
		"cm",
		"d",
		"cd",
		"c",
		"xc",
		"l",
		"xl",
		"x",
		"ix",
		"v",
		"iv",
		"i",
	];
	let result = "";
	let remaining = num;
	for (let i = 0; i < vals.length; i++) {
		while (remaining >= vals[i]) {
			result += syms[i];
			remaining -= vals[i];
		}
	}
	return result;
}

/** Format a page number according to the chosen format. */
function formatPageNumber(
	pageNum: number,
	totalPages: number,
	format: string,
): string {
	switch (format) {
		case "page-n":
			return `Page ${pageNum}`;
		case "n-of-total":
			return `${pageNum} of ${totalPages}`;
		case "page-n-of-total":
			return `Page ${pageNum} of ${totalPages}`;
		case "roman":
			return toRoman(pageNum);
		default:
			return `${pageNum}`;
	}
}

const tool: ToolDefinition = {
	id: "page-numbers-pdf",
	name: "Add Page Numbers to PDF",
	category: "pdf",
	description: "Add page numbers to every page of a PDF.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "position",
			type: "string",
			description: "Position of the page number on the page",
			default: "bottom-center",
			choices: [
				"top-left",
				"top-center",
				"top-right",
				"bottom-left",
				"bottom-center",
				"bottom-right",
			],
		},
		{
			name: "format",
			type: "string",
			description: "Page number format",
			default: "number",
			choices: ["number", "page-n", "n-of-total", "page-n-of-total", "roman"],
		},
		{
			name: "fontSize",
			type: "number",
			description: "Font size in points",
			default: 12,
			min: 8,
			max: 24,
		},
		{
			name: "startNumber",
			type: "number",
			description: "Starting page number",
			default: 1,
			min: 1,
			max: 9999,
		},
		{
			name: "margin",
			type: "number",
			description: "Margin offset from page edge in points",
			default: 40,
			min: 20,
			max: 100,
		},
		{
			name: "skipFirst",
			type: "boolean",
			description: "Skip the first page (e.g. title page)",
			default: false,
		},
	],
	execute: async (input, options, context) => {
		const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

		const position = (options.position as string) || "bottom-center";
		const format = (options.format as string) || "number";
		const fontSize = (options.fontSize as number) || 12;
		const startNumber = (options.startNumber as number) || 1;
		const margin = (options.margin as number) || 40;
		const skipFirst = (options.skipFirst as boolean) ?? false;

		let doc: import("pdf-lib").PDFDocument;
		try {
			doc = await PDFDocument.load(input, {
				ignoreEncryption: true,
			});
		} catch (err) {
			throw new Error(
				`Failed to load PDF: ${err instanceof Error ? err.message : "Invalid PDF"}`,
			);
		}

		const font = await doc.embedFont(StandardFonts.Helvetica);
		const pages = doc.getPages();
		const totalPages = skipFirst ? pages.length - 1 : pages.length;

		for (let i = 0; i < pages.length; i++) {
			if (skipFirst && i === 0) {
				context.onProgress?.(Math.round(((i + 1) / pages.length) * 100));
				continue;
			}

			const page = pages[i];
			const { width, height } = page.getSize();
			const pageNum = skipFirst ? startNumber + i - 1 : startNumber + i;
			const text = formatPageNumber(
				pageNum,
				totalPages + startNumber - 1,
				format,
			);
			const textWidth = font.widthOfTextAtSize(text, fontSize);
			const textHeight = font.heightAtSize(fontSize);

			// Calculate x based on horizontal position
			const [vertical, horizontal] = position.split("-");
			let x: number;
			switch (horizontal) {
				case "left":
					x = margin;
					break;
				case "right":
					x = width - textWidth - margin;
					break;
				default:
					x = (width - textWidth) / 2;
					break;
			}

			// Calculate y based on vertical position
			let y: number;
			if (vertical === "top") {
				y = height - margin - textHeight;
			} else {
				y = margin;
			}

			page.drawText(text, {
				x,
				y,
				font,
				size: fontSize,
				color: rgb(0, 0, 0),
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
				format,
				position,
			},
		};
	},
};

registerTool(tool);
export default tool;
