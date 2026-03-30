import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "uuid-generator",
	name: "UUID Generator",
	category: "developer",
	description:
		"Generate UUID v4 (random) and UUID v7 (timestamp-ordered) identifiers.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "version",
			type: "string",
			description: "UUID version to generate",
			default: "v4",
			choices: ["v4", "v7"],
		},
		{
			name: "count",
			type: "number",
			description: "Number of UUIDs to generate",
			default: 1,
			min: 1,
			max: 1000,
		},
	],
	capabilities: ["browser"],
	execute: async (_input, options, _context) => {
		const version = (options.version as string) || "v4";
		const count = Math.min(Math.max(1, (options.count as number) || 1), 1000);

		const uuids: string[] = [];
		for (let i = 0; i < count; i++) {
			if (version === "v7") {
				uuids.push(generateUuidV7());
			} else {
				uuids.push(crypto.randomUUID());
			}
		}

		const text = uuids.join("\n");
		const output = new TextEncoder().encode(text);

		return {
			output,
			extension: ".txt",
			mimeType: "text/plain",
			metadata: { count, version },
		};
	},
};

function generateUuidV7(): string {
	const now = Date.now();
	const bytes = new Uint8Array(16);
	// Timestamp in first 48 bits (big-endian)
	bytes[0] = (now / 2 ** 40) & 0xff;
	bytes[1] = (now / 2 ** 32) & 0xff;
	bytes[2] = (now / 2 ** 24) & 0xff;
	bytes[3] = (now / 2 ** 16) & 0xff;
	bytes[4] = (now / 2 ** 8) & 0xff;
	bytes[5] = now & 0xff;
	// Random fill remaining bytes
	crypto.getRandomValues(bytes.subarray(6));
	// Set version 7 (0111 in bits 48-51)
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	// Set variant 10xx (bits 64-65)
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	// Format as UUID string
	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

registerTool(tool);
export default tool;
