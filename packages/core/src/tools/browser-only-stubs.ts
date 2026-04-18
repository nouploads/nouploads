/**
 * Stub tool definitions for genuinely browser-only features.
 * These register in the tool registry for metadata/discovery purposes,
 * but their execute functions throw a clear error in non-browser environments.
 *
 * Tools listed here truly cannot run in Node — they need DOM APIs (Canvas,
 * pdfjs-dist via DOMMatrix), browser-only WASM libraries (gifsicle), or
 * browser-only ML models. Tools that delegate to imageBackend (e.g. all the
 * HEIC variants) live in their own files and work in any environment that
 * supplies a backend.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

function browserOnlyExecute(toolName: string) {
	return async (): Promise<never> => {
		throw new Error(
			`${toolName} requires a browser environment with Canvas/WASM support. ` +
				"Use the web app at https://nouploads.com for this tool.",
		);
	};
}

const removeBackground: ToolDefinition = {
	id: "remove-background",
	name: "Remove Background",
	category: "image",
	description:
		"Remove image backgrounds using AI inference. Requires browser environment.",
	inputMimeTypes: ["image/jpeg", "image/png", "image/webp"],
	inputExtensions: [".jpg", ".jpeg", ".png", ".webp"],
	options: [],
	capabilities: ["browser", "wasm"],
	execute: browserOnlyExecute("Remove Background"),
};

const gifFrames: ToolDefinition = {
	id: "gif-frames",
	name: "GIF Frame Extractor",
	category: "image",
	description:
		"Extract individual frames from animated GIF files. Requires browser environment.",
	inputMimeTypes: ["image/gif"],
	inputExtensions: [".gif"],
	options: [],
	capabilities: ["browser"],
	execute: browserOnlyExecute("GIF Frame Extractor"),
};

const pdfToJpg: ToolDefinition = {
	id: "pdf-to-jpg",
	name: "PDF to JPG Converter",
	category: "pdf",
	description:
		"Convert PDF pages to JPG images. Requires browser environment for PDF rendering.",
	from: "pdf",
	to: "jpg",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "dpi",
			type: "number",
			description: "Output resolution in DPI",
			default: 150,
			min: 72,
			max: 600,
		},
		{
			name: "quality",
			type: "number",
			description: "JPG quality (1-100)",
			default: 80,
			min: 1,
			max: 100,
		},
	],
	capabilities: ["browser"],
	execute: browserOnlyExecute("PDF to JPG"),
};

const pdfToPng: ToolDefinition = {
	id: "pdf-to-png",
	name: "PDF to PNG Converter",
	category: "pdf",
	description:
		"Convert PDF pages to PNG images. Requires browser environment for PDF rendering.",
	from: "pdf",
	to: "png",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "dpi",
			type: "number",
			description: "Output resolution in DPI",
			default: 150,
			min: 72,
			max: 600,
		},
	],
	capabilities: ["browser"],
	execute: browserOnlyExecute("PDF to PNG"),
};

const compressPdf: ToolDefinition = {
	id: "compress-pdf",
	name: "Compress PDF",
	category: "pdf",
	description:
		"Compress PDF files by re-rendering pages at reduced quality. Requires browser environment.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [
		{
			name: "level",
			type: "string",
			description: "Compression level",
			default: "medium",
			choices: ["low", "medium", "high"],
		},
	],
	capabilities: ["browser"],
	execute: browserOnlyExecute("Compress PDF"),
};

registerTool(removeBackground);
registerTool(gifFrames);
registerTool(pdfToJpg);
registerTool(pdfToPng);
registerTool(compressPdf);

export { compressPdf, gifFrames, pdfToJpg, pdfToPng, removeBackground };
