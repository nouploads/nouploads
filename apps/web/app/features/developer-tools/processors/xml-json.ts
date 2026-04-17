/**
 * XML ↔ JSON conversion, validation, and format detection.
 * Uses fast-xml-parser (~45 KB) — shared with the XML Formatter tool.
 */
import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";

const PARSER_OPTIONS = {
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
	parseAttributeValue: true,
	trimValues: true,
};

export interface ConversionResult {
	output: string;
	error?: string;
}

/**
 * Replace Unicode smart quotes and apostrophes with their ASCII equivalents.
 * Copy-pasting XML from markdown renderers, chat apps, or word processors
 * often substitutes curly quotes, which fast-xml-parser's strict validator
 * rejects ("Attribute ... is without value") while its lenient parser
 * silently drops the surrounding attributes. Normalizing first lets both
 * paths see the same well-formed input.
 */
export function normalizeSmartQuotes(input: string): string {
	return input
		.replace(/[\u201C\u201D\u201E\u201F]/g, '"')
		.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
}

export function xmlToJson(input: string, indent: number = 2): ConversionResult {
	try {
		const parser = new XMLParser(PARSER_OPTIONS);
		const parsed = parser.parse(normalizeSmartQuotes(input));
		const output = JSON.stringify(parsed, null, indent);
		return { output };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid XML";
		return { output: "", error: msg };
	}
}

export function jsonToXml(input: string, indent: number = 2): ConversionResult {
	try {
		const parsed = JSON.parse(input);
		const builder = new XMLBuilder({
			ignoreAttributes: false,
			attributeNamePrefix: "@_",
			format: true,
			indentBy: " ".repeat(indent),
		});
		const output = builder.build(parsed);
		return { output };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { output: "", error: msg };
	}
}

export function detectFormat(input: string): "xml" | "json" | "unknown" {
	const trimmed = input.trim();
	if (!trimmed) return "unknown";
	// XML starts with `<`
	if (trimmed.startsWith("<")) return "xml";
	// JSON starts with `{` or `[`
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	// Try parsing as JSON to catch edge cases
	try {
		JSON.parse(trimmed);
		return "json";
	} catch {
		// not JSON
	}
	return "unknown";
}

export function validateXml(input: string): {
	valid: boolean;
	error?: string;
} {
	if (!input.trim()) {
		return { valid: false, error: "Empty input" };
	}
	// Strip leading whitespace before validation: the XML spec requires the
	// declaration (`<?xml ...?>`) to be at offset 0, but users commonly paste
	// indented snippets. fast-xml-parser's parser tolerates it silently while
	// the validator rejects it — leading to a confusing "Invalid XML /
	// Valid JSON" UI state. Normalize so both paths agree.
	const normalized = normalizeSmartQuotes(input).trimStart();
	const result = XMLValidator.validate(normalized, {
		allowBooleanAttributes: true,
	});
	if (result === true) {
		return { valid: true };
	}
	return {
		valid: false,
		error: result.err?.msg ?? "Invalid XML",
	};
}

export function validateJson(input: string): {
	valid: boolean;
	error?: string;
} {
	if (!input.trim()) {
		return { valid: false, error: "Empty input" };
	}
	try {
		JSON.parse(input);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { valid: false, error: msg };
	}
}

/** Max input size: 10 MB */
export const MAX_INPUT_SIZE = 10 * 1024 * 1024;
