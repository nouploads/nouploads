import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "jwt-decoder",
	name: "JWT Decoder",
	category: "developer",
	description:
		"Decode and inspect JWT tokens. View header, payload, and expiration status.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [],
	execute: async (input, _options, context) => {
		const token = new TextDecoder().decode(input).trim();
		context.onProgress?.(10);

		if (!token) {
			throw new Error("Empty input: please provide a JWT token");
		}

		const parts = token.split(".");
		if (parts.length !== 3) {
			throw new Error("Invalid JWT: expected 3 parts separated by dots");
		}

		// base64url decode
		function b64UrlDecode(str: string): string {
			const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
			const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
			// Use Buffer in Node, atob in browser
			if (typeof Buffer !== "undefined") {
				return Buffer.from(padded, "base64").toString("utf-8");
			}
			return atob(padded);
		}

		const header = JSON.parse(b64UrlDecode(parts[0]));
		const payload = JSON.parse(b64UrlDecode(parts[1]));

		context.onProgress?.(100);

		const result = JSON.stringify({ header, payload }, null, 2);
		return {
			output: new TextEncoder().encode(result),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
