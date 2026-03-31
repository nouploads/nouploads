import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "word-counter",
	name: "Word Counter",
	category: "developer",
	description:
		"Count characters, words, sentences, paragraphs, and estimate reading time.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [],
	capabilities: ["browser"],
	execute: async (input, _options, _context) => {
		const text = new TextDecoder().decode(input);

		const characters = text.length;
		const charactersNoSpaces = text.replace(/\s/g, "").length;

		const trimmed = text.trim();
		const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
		const sentences = trimmed
			? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
			: 0;
		const paragraphs = trimmed
			? trimmed.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0).length
			: 0;

		const readingMinutes = words > 0 ? words / 238 : 0;
		const readingTime =
			words === 0
				? "0 min"
				: readingMinutes < 1
					? "< 1 min"
					: `~${Math.round(readingMinutes)} min`;

		const stats = {
			characters,
			charactersNoSpaces,
			words,
			sentences,
			paragraphs,
			readingTime,
		};

		const output = new TextEncoder().encode(JSON.stringify(stats, null, 2));

		return {
			output,
			extension: ".json",
			mimeType: "application/json",
			metadata: stats,
		};
	},
};

registerTool(tool);
export default tool;
