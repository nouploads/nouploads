import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "qr-code-generate",
	name: "QR Code Generator",
	category: "developer",
	description: "Generate QR codes as PNG images from text input.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "text",
			type: "string",
			description: "Text or URL to encode in the QR code",
			required: true,
		},
		{
			name: "size",
			type: "number",
			description: "Output image size in pixels (width and height)",
			default: 300,
			min: 50,
			max: 2000,
		},
		{
			name: "errorCorrection",
			type: "string",
			description: "Error correction level",
			default: "M",
			choices: ["L", "M", "Q", "H"],
		},
		{
			name: "margin",
			type: "number",
			description: "Quiet zone margin in modules",
			default: 4,
			min: 0,
			max: 10,
		},
	],
	execute: async (input, options, context) => {
		const QRCode = await import("qrcode");
		// Text comes from options or from the input file content
		const text =
			(options.text as string) || new TextDecoder().decode(input).trim();

		if (!text) {
			throw new Error(
				"No text provided. Pass --text or provide a text file as input.",
			);
		}

		const size = (options.size as number) ?? 300;
		const errorCorrectionLevel = (options.errorCorrection as string) ?? "M";
		const margin = (options.margin as number) ?? 4;

		context.onProgress?.(10);

		const buffer = await QRCode.toBuffer(text, {
			type: "png",
			width: size,
			margin,
			errorCorrectionLevel: errorCorrectionLevel as "L" | "M" | "Q" | "H",
		});

		context.onProgress?.(100);

		return {
			output: new Uint8Array(buffer),
			extension: ".png",
			mimeType: "image/png",
			metadata: { text, size, errorCorrectionLevel, margin },
		};
	},
};

registerTool(tool);
export default tool;
