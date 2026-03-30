import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "pdf-to-text",
	name: "PDF to Text Extractor",
	category: "pdf",
	description:
		"Extract all text content from a PDF document. Requires browser environment for PDF parsing.",
	inputMimeTypes: ["application/pdf"],
	inputExtensions: [".pdf"],
	options: [],
	capabilities: ["browser"],
	execute: async () => {
		throw new Error(
			"pdf-to-text requires a browser environment with PDF.js support. " +
				"Use the web app at https://nouploads.com for this tool.",
		);
	},
};

registerTool(tool);
export default tool;
