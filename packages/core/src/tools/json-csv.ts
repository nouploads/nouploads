import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "json-csv",
	name: "JSON ↔ CSV Converter",
	category: "developer",
	description: "Convert between JSON arrays and CSV with RFC 4180 compliance.",
	inputMimeTypes: ["application/json", "text/csv"],
	inputExtensions: [".json", ".csv"],
	options: [
		{
			name: "direction",
			type: "string",
			description: "Conversion direction",
			default: "json-to-csv",
			choices: ["json-to-csv", "csv-to-json"],
		},
		{
			name: "delimiter",
			type: "string",
			description: "Field delimiter",
			default: ",",
			choices: [",", "\t", ";"],
		},
		{
			name: "flatten",
			type: "boolean",
			description: "Flatten nested objects with dot notation",
			default: true,
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const direction = (options.direction as string) || "json-to-csv";
		const delimiter = (options.delimiter as string) || ",";
		const flatten = options.flatten !== false;

		context.onProgress?.(10);

		if (direction === "json-to-csv") {
			const parsed = JSON.parse(text);
			if (!Array.isArray(parsed)) {
				throw new Error("Input must be a JSON array of objects.");
			}
			// Inline minimal CSV conversion for core (no web processor dependency)
			const rows: Record<string, unknown>[] = parsed.map((item: unknown) => {
				if (item === null || typeof item !== "object" || Array.isArray(item)) {
					throw new Error("Each element in the JSON array must be an object.");
				}
				return flatten
					? flattenObj(item as Record<string, unknown>)
					: (item as Record<string, unknown>);
			});

			const headerSet = new Set<string>();
			for (const row of rows) {
				for (const key of Object.keys(row)) {
					headerSet.add(key);
				}
			}
			const headers = Array.from(headerSet);

			const csvLines: string[] = [
				headers.map((h) => escapeField(h, delimiter)).join(delimiter),
			];
			for (const row of rows) {
				const vals = headers.map((h) => {
					const v = row[h];
					if (v === undefined || v === null) return "";
					if (typeof v === "object")
						return escapeField(JSON.stringify(v), delimiter);
					return escapeField(String(v), delimiter);
				});
				csvLines.push(vals.join(delimiter));
			}

			context.onProgress?.(100);
			return {
				output: new TextEncoder().encode(csvLines.join("\n")),
				extension: ".csv",
				mimeType: "text/csv",
			};
		}

		// csv-to-json
		const lines = text.trim().split(/\r?\n/);
		if (lines.length === 0) {
			context.onProgress?.(100);
			return {
				output: new TextEncoder().encode("[]"),
				extension: ".json",
				mimeType: "application/json",
			};
		}

		const headers = lines[0].split(delimiter);
		const result: Record<string, string>[] = [];
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(delimiter);
			const obj: Record<string, string> = {};
			for (let j = 0; j < headers.length; j++) {
				obj[headers[j]] = values[j] ?? "";
			}
			result.push(obj);
		}

		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(JSON.stringify(result, null, 2)),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

function flattenObj(
	obj: Record<string, unknown>,
	prefix = "",
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(
				result,
				flattenObj(value as Record<string, unknown>, fullKey),
			);
		} else {
			result[fullKey] = value;
		}
	}
	return result;
}

function escapeField(value: string, delimiter: string): string {
	if (
		value.includes(delimiter) ||
		value.includes('"') ||
		value.includes("\n") ||
		value.includes("\r")
	) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

registerTool(tool);
export default tool;
