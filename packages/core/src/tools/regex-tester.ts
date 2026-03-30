import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "regex-tester",
	name: "Regex Tester",
	category: "developer",
	description:
		"Test regular expressions with match highlighting and capture groups.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "pattern",
			type: "string",
			description: "Regular expression pattern",
			default: "",
		},
		{
			name: "flags",
			type: "string",
			description: "Regex flags (e.g. g, i, m, s, u)",
			default: "g",
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const pattern = (options.pattern as string) || "";
		const flags = (options.flags as string) || "g";

		context.onProgress?.(10);

		if (!pattern) {
			throw new Error("No pattern provided");
		}

		const regex = new RegExp(pattern, flags);
		const matches: Array<{
			fullMatch: string;
			index: number;
			groups: string[];
			groupNames?: Record<string, string>;
		}> = [];

		for (const match of text.matchAll(
			new RegExp(
				regex.source,
				regex.flags.includes("g") ? regex.flags : `${regex.flags}g`,
			),
		)) {
			matches.push({
				fullMatch: match[0],
				index: match.index ?? 0,
				groups: match.slice(1).map((g) => g ?? ""),
				groupNames: match.groups
					? Object.fromEntries(
							Object.entries(match.groups).map(([k, v]) => [k, v ?? ""]),
						)
					: undefined,
			});
		}

		context.onProgress?.(100);

		const result = JSON.stringify(
			{ matches, matchCount: matches.length },
			null,
			2,
		);
		return {
			output: new TextEncoder().encode(result),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
