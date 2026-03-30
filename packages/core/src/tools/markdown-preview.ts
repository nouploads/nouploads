import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "markdown-preview",
	name: "Markdown Preview",
	category: "developer",
	description: "Live Markdown editor with real-time rendered preview.",
	inputMimeTypes: ["text/markdown", "text/plain"],
	inputExtensions: [".md", ".txt", ".markdown"],
	options: [
		{
			name: "gfm",
			type: "boolean",
			description: "Enable GitHub Flavored Markdown",
			default: true,
		},
	],
	capabilities: ["browser"],
	execute: async (_input, _options, _context) => {
		throw new Error("Markdown preview requires a browser environment");
	},
};

registerTool(tool);
export default tool;
