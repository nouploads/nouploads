/**
 * Stub tool definitions for browser-only features.
 * These register in the tool registry for metadata/discovery purposes,
 * but their execute functions throw a clear error in non-browser environments.
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

const heicToPng: ToolDefinition = {
	id: "heic-to-png",
	name: "HEIC to PNG Converter",
	category: "image",
	description: "Convert HEIC/HEIF images to PNG format.",
	from: "heic",
	to: "png",
	inputMimeTypes: ["image/heic", "image/heif"],
	inputExtensions: [".heic", ".heif"],
	options: [],
	execute: async (input, _options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for HEIC to PNG conversion");
		}
		if (context.imageBackend.transcode) {
			const result = await context.imageBackend.transcode(
				input,
				"heic",
				"png",
				{
					format: "png",
				},
			);
			return { output: result, extension: ".png", mimeType: "image/png" };
		}
		const decoded = await context.imageBackend.decode(input, "heic");
		const encoded = await context.imageBackend.encode(decoded, {
			format: "png",
		});
		return { output: encoded, extension: ".png", mimeType: "image/png" };
	},
};

const heicToWebp: ToolDefinition = {
	id: "heic-to-webp",
	name: "HEIC to WebP Converter",
	category: "image",
	description: "Convert HEIC/HEIF images to WebP format.",
	from: "heic",
	to: "webp",
	inputMimeTypes: ["image/heic", "image/heif"],
	inputExtensions: [".heic", ".heif"],
	options: [
		{
			name: "quality",
			type: "number",
			description: "WebP quality (1-100)",
			default: 80,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for HEIC to WebP conversion");
		}
		const quality = (options.quality as number) ?? 80;
		if (context.imageBackend.transcode) {
			const result = await context.imageBackend.transcode(
				input,
				"heic",
				"webp",
				{
					format: "webp",
					quality,
				},
			);
			return { output: result, extension: ".webp", mimeType: "image/webp" };
		}
		const decoded = await context.imageBackend.decode(input, "heic");
		const encoded = await context.imageBackend.encode(decoded, {
			format: "webp",
			quality,
		});
		return { output: encoded, extension: ".webp", mimeType: "image/webp" };
	},
};

registerTool(removeBackground);
registerTool(gifFrames);
registerTool(pdfToJpg);
registerTool(pdfToPng);
registerTool(compressPdf);
registerTool(heicToPng);
registerTool(heicToWebp);

export {
	compressPdf,
	gifFrames,
	heicToPng,
	heicToWebp,
	pdfToJpg,
	pdfToPng,
	removeBackground,
};
