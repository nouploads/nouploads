import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";
import {
	decodeBase64,
	encodeBase64,
	mimeFromDataUri,
	stripDataUriPrefix,
} from "../util/base64.js";

const encodeTool: ToolDefinition = {
	id: "base64-encode",
	name: "Base64 Encoder",
	category: "developer",
	description:
		"Encode any file to base64 text. Outputs a data URI or raw base64 string.",
	inputMimeTypes: [],
	inputExtensions: [],
	options: [
		{
			name: "dataUri",
			type: "boolean",
			description:
				"Output as a data URI (data:mime;base64,...) instead of raw base64",
			default: false,
		},
		{
			name: "mimeType",
			type: "string",
			description: "MIME type for data URI (auto-detected if not specified)",
		},
	],
	execute: async (input, options) => {
		const raw = encodeBase64(input);
		const useDataUri = (options.dataUri as boolean) ?? false;
		const mime = (options.mimeType as string) ?? "application/octet-stream";

		const text = useDataUri ? `data:${mime};base64,${raw}` : raw;
		const output = new TextEncoder().encode(text);

		return {
			output,
			extension: ".txt",
			mimeType: "text/plain",
			metadata: {
				inputSize: input.byteLength,
				base64Length: raw.length,
			},
		};
	},
};

const decodeTool: ToolDefinition = {
	id: "base64-decode",
	name: "Base64 Decoder",
	category: "developer",
	description:
		"Decode a base64 string or data URI back to its original binary file.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt", ".b64"],
	options: [],
	execute: async (input) => {
		const text = new TextDecoder().decode(input).trim();
		const detectedMime = mimeFromDataUri(text);
		const base64Content = stripDataUriPrefix(text);
		const output = decodeBase64(base64Content);

		// Guess extension from detected MIME
		const mimeToExt: Record<string, string> = {
			"image/png": ".png",
			"image/jpeg": ".jpg",
			"image/webp": ".webp",
			"image/gif": ".gif",
			"image/svg+xml": ".svg",
			"application/pdf": ".pdf",
		};

		return {
			output,
			extension: mimeToExt[detectedMime ?? ""] ?? ".bin",
			mimeType: detectedMime ?? "application/octet-stream",
			metadata: {
				detectedMime,
				outputSize: output.byteLength,
			},
		};
	},
};

registerTool(encodeTool);
registerTool(decodeTool);

export { decodeTool, encodeTool };
