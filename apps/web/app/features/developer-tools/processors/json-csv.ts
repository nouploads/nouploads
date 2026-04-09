/**
 * Bidirectional JSON ↔ CSV converter.
 * RFC 4180 compliant CSV output. Zero dependencies — uses only built-in APIs.
 */

/** Max input size: 10 MB */
export const MAX_INPUT_SIZE = 10 * 1024 * 1024;

// ── Helpers ──

/**
 * Flatten a nested object into dot-notation keys.
 * e.g. { user: { name: "Alice" } } → { "user.name": "Alice" }
 */
export function flattenObject(
	obj: Record<string, unknown>,
	prefix = "",
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(obj)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		const value = obj[key];
		if (
			value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			!(value instanceof Date)
		) {
			Object.assign(
				result,
				flattenObject(value as Record<string, unknown>, fullKey),
			);
		} else {
			result[fullKey] = value;
		}
	}
	return result;
}

/**
 * Escape a single CSV field per RFC 4180.
 * Fields containing the delimiter, double quotes, or newlines are wrapped
 * in double quotes, with inner double quotes doubled.
 */
export function escapeCSVField(value: string, delimiter: string): string {
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

/**
 * Parse a single CSV line respecting quoted fields (which may contain
 * the delimiter, newlines, and escaped double quotes).
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const ch = line[i];

		if (inQuotes) {
			if (ch === '"') {
				// Look ahead for escaped quote
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i += 2;
					continue;
				}
				// End of quoted field
				inQuotes = false;
				i++;
				continue;
			}
			current += ch;
			i++;
		} else {
			if (ch === '"') {
				inQuotes = true;
				i++;
				continue;
			}
			if (line.substring(i, i + delimiter.length) === delimiter) {
				fields.push(current);
				current = "";
				i += delimiter.length;
				continue;
			}
			current += ch;
			i++;
		}
	}

	fields.push(current);
	return fields;
}

/**
 * Split CSV text into logical lines, respecting quoted fields that span
 * multiple physical lines.
 */
function splitCSVLines(text: string): string[] {
	const lines: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];

		if (ch === '"') {
			inQuotes = !inQuotes;
			current += ch;
			continue;
		}

		if (!inQuotes && (ch === "\n" || ch === "\r")) {
			// Handle \r\n
			if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
				i++;
			}
			lines.push(current);
			current = "";
			continue;
		}

		current += ch;
	}

	// Push last line if non-empty
	if (current.length > 0) {
		lines.push(current);
	}

	return lines;
}

// ── Main conversion functions ──

export interface JsonToCsvOptions {
	delimiter?: string;
	flatten?: boolean;
	includeHeaders?: boolean;
}

/**
 * Convert a JSON array of objects to CSV (RFC 4180).
 * Returns the CSV string.
 */
export function jsonToCsv(
	input: string,
	options: JsonToCsvOptions = {},
): string {
	const { delimiter = ",", flatten = true, includeHeaders = true } = options;

	const parsed = JSON.parse(input);

	if (!Array.isArray(parsed)) {
		throw new Error(
			`Input must be a JSON array of objects. Got ${typeof parsed}.`,
		);
	}

	if (parsed.length === 0) {
		return "";
	}

	// Process rows, optionally flattening
	const rows: Record<string, unknown>[] = parsed.map((item) => {
		if (item === null || typeof item !== "object" || Array.isArray(item)) {
			throw new Error(
				`Each element in the JSON array must be an object. Got ${item === null ? "null" : Array.isArray(item) ? "array" : typeof item}.`,
			);
		}
		return flatten
			? flattenObject(item as Record<string, unknown>)
			: (item as Record<string, unknown>);
	});

	// Collect all unique headers in insertion order
	const headerSet = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			headerSet.add(key);
		}
	}
	const headers = Array.from(headerSet);

	const lines: string[] = [];

	if (includeHeaders) {
		lines.push(
			headers.map((h) => escapeCSVField(h, delimiter)).join(delimiter),
		);
	}

	for (const row of rows) {
		const values = headers.map((h) => {
			const val = row[h];
			if (val === undefined || val === null) return "";
			if (typeof val === "object")
				return escapeCSVField(JSON.stringify(val), delimiter);
			return escapeCSVField(String(val), delimiter);
		});
		lines.push(values.join(delimiter));
	}

	return lines.join("\n");
}

export interface CsvToJsonOptions {
	delimiter?: string;
}

/**
 * Convert CSV text to a JSON array of objects.
 * First row is treated as headers.
 * Returns the JSON string (formatted with 2-space indent).
 */
export function csvToJson(
	input: string,
	options: CsvToJsonOptions = {},
): string {
	const { delimiter = "," } = options;

	const trimmed = input.trim();
	if (!trimmed) {
		return "[]";
	}

	const lines = splitCSVLines(trimmed);

	if (lines.length === 0) {
		return "[]";
	}

	const headers = parseCSVLine(lines[0], delimiter);

	if (headers.length === 0 || headers.every((h) => h === "")) {
		throw new Error(
			"CSV must have a header row with at least one column name.",
		);
	}

	const result: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i], delimiter);
		const obj: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			obj[headers[j]] = values[j] ?? "";
		}
		result.push(obj);
	}

	return JSON.stringify(result, null, 2);
}
