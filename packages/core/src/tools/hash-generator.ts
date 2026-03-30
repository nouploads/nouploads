import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "hash-generator",
	name: "Hash Generator",
	category: "developer",
	description:
		"Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes from text or files.",
	inputMimeTypes: ["*/*"],
	inputExtensions: ["*"],
	options: [
		{
			name: "algorithm",
			type: "string",
			description: "Hash algorithm",
			default: "sha256",
			choices: ["md5", "sha1", "sha256", "sha384", "sha512"],
		},
	],
	capabilities: ["browser"],
	execute: async (_input, _options, _context) => {
		throw new Error("Hash generation requires browser environment");
	},
};

registerTool(tool);
export default tool;
