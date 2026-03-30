import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "timestamp-converter",
	name: "Timestamp Converter",
	category: "developer",
	description: "Convert between Unix timestamps and human-readable dates.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Convert timestamp to date or date to timestamp",
			default: "to-date",
			choices: ["to-date", "to-timestamp"],
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input).trim();
		const mode = (options.mode as string) || "to-date";

		context.onProgress?.(10);

		if (!text) {
			throw new Error("Empty input");
		}

		let resultObj: Record<string, unknown>;

		if (mode === "to-date") {
			const num = Number(text);
			if (Number.isNaN(num)) {
				throw new Error(`Invalid timestamp: "${text}" is not a number`);
			}

			// Auto-detect seconds vs milliseconds
			const isMs = Math.abs(num) > 1e12;
			const ms = isMs ? num : num * 1000;
			const date = new Date(ms);

			if (Number.isNaN(date.getTime())) {
				throw new Error("Invalid timestamp: could not create date");
			}

			resultObj = {
				unix: Math.floor(ms / 1000),
				unixMs: ms,
				iso8601: date.toISOString(),
				rfc2822: date.toUTCString(),
				utc: date.toUTCString(),
			};
		} else {
			const date = new Date(text);
			if (Number.isNaN(date.getTime())) {
				throw new Error(`Invalid date string: "${text}"`);
			}

			resultObj = {
				unix: Math.floor(date.getTime() / 1000),
				unixMs: date.getTime(),
				iso8601: date.toISOString(),
				rfc2822: date.toUTCString(),
				utc: date.toUTCString(),
			};
		}

		context.onProgress?.(100);

		const result = JSON.stringify(resultObj, null, 2);
		return {
			output: new TextEncoder().encode(result),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
