/**
 * QR code generation (PNG + SVG). Single source of truth for web and CLI.
 * Uses the qrcode library. Async.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export interface QrCodeOptions {
	size?: number;
	errorCorrection?: ErrorCorrectionLevel;
	foreground?: string;
	background?: string;
	margin?: number;
}

/** Max content length for QR codes (alphanumeric mode) */
export const MAX_QR_LENGTH = 4296;

/** Generate a QR code as a PNG-encoded Uint8Array. */
export async function generateQrPng(
	text: string,
	options: QrCodeOptions = {},
): Promise<Uint8Array> {
	if (!text.trim()) throw new Error("Text is required");
	const {
		size = 300,
		errorCorrection = "M",
		foreground = "#000000",
		background = "#ffffff",
		margin = 4,
	} = options;

	const QRCode = await import("qrcode");
	const dataUrl = await QRCode.toDataURL(text, {
		width: size,
		margin,
		errorCorrectionLevel: errorCorrection,
		color: { dark: foreground, light: background },
	});
	const base64 = dataUrl.split(",")[1];
	if (typeof Buffer !== "undefined") {
		return new Uint8Array(Buffer.from(base64, "base64"));
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

/** Generate a QR code as an SVG string. */
export async function generateQrSvg(
	text: string,
	options: QrCodeOptions = {},
): Promise<string> {
	if (!text.trim()) throw new Error("Text is required");
	const {
		errorCorrection = "M",
		foreground = "#000000",
		background = "#ffffff",
		margin = 4,
	} = options;

	const QRCode = await import("qrcode");
	return QRCode.toString(text, {
		type: "svg",
		margin,
		errorCorrectionLevel: errorCorrection,
		color: { dark: foreground, light: background },
	});
}

const tool: ToolDefinition = {
	id: "qr-code-generate",
	name: "QR Code Generator",
	category: "developer",
	description: "Generate QR codes as PNG images from text or URLs.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "text",
			type: "string",
			description: "Text or URL to encode in the QR code",
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
		{
			name: "foreground",
			type: "string",
			description: "Foreground color (hex)",
			default: "#000000",
		},
		{
			name: "background",
			type: "string",
			description: "Background color (hex)",
			default: "#ffffff",
		},
	],
	execute: async (input, options, context) => {
		const text =
			(options.text as string) || new TextDecoder().decode(input).trim();
		if (!text) {
			throw new Error(
				"No text provided. Pass --text or provide a text file as input.",
			);
		}

		context.onProgress?.(10);
		const png = await generateQrPng(text, {
			size: options.size as number,
			errorCorrection: options.errorCorrection as ErrorCorrectionLevel,
			foreground: options.foreground as string,
			background: options.background as string,
			margin: options.margin as number,
		});
		context.onProgress?.(100);

		return {
			output: png,
			extension: ".png",
			mimeType: "image/png",
			metadata: { text },
		};
	},
};

registerTool(tool);
export default tool;
