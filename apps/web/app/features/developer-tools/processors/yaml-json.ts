/**
 * YAML ↔ JSON conversion, validation, and format detection.
 * Uses js-yaml for YAML parsing/serialization.
 */
import yaml from "js-yaml";

export interface ConversionResult {
	output: string;
	error?: string;
}

export function yamlToJson(
	input: string,
	indent: number = 2,
): ConversionResult {
	try {
		const parsed = yaml.load(input);
		const output = JSON.stringify(parsed, null, indent);
		return { output };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid YAML";
		return { output: "", error: msg };
	}
}

export function jsonToYaml(
	input: string,
	indent: number = 2,
): ConversionResult {
	try {
		const parsed = JSON.parse(input);
		const output = yaml.dump(parsed, { indent, lineWidth: -1 });
		return { output };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid JSON";
		return { output: "", error: msg };
	}
}

export function detectFormat(input: string): "yaml" | "json" | "unknown" {
	const trimmed = input.trim();
	if (!trimmed) return "unknown";
	// JSON always starts with { or [
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	// Try parsing as JSON to catch edge cases like strings/numbers
	try {
		JSON.parse(trimmed);
		return "json";
	} catch {
		// not JSON
	}
	// If it's not JSON, assume YAML (YAML is a superset)
	return "yaml";
}

export function validateYaml(input: string): {
	valid: boolean;
	error?: string;
} {
	try {
		yaml.load(input);
		return { valid: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Invalid YAML";
		return { valid: false, error: msg };
	}
}

export function validateJson(input: string): {
	valid: boolean;
	error?: string;
} {
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
