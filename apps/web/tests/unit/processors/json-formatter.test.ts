import { describe, expect, it } from "vitest";
import {
	computeJsonStats,
	formatJson,
	MAX_JSON_SIZE,
	minifyJson,
	validateJson,
} from "~/features/developer-tools/processors/json-formatter";

describe("formatJson", () => {
	it("should format a simple object with 2-space indent", () => {
		const input = '{"a":1,"b":2}';
		const result = formatJson(input);
		expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
	});

	it("should format with custom indent", () => {
		const input = '{"a":1}';
		const result = formatJson(input, 4);
		expect(result).toBe('{\n    "a": 1\n}');
	});

	it("should format nested objects", () => {
		const input = '{"a":{"b":{"c":1}}}';
		const result = formatJson(input, 2);
		expect(result).toContain("  ");
		expect(result).toContain('"c": 1');
	});

	it("should format arrays", () => {
		const input = "[1,2,3]";
		const result = formatJson(input);
		expect(result).toBe("[\n  1,\n  2,\n  3\n]");
	});

	it("should throw on invalid JSON", () => {
		expect(() => formatJson("{invalid}")).toThrow();
	});

	it("should handle empty object", () => {
		expect(formatJson("{}")).toBe("{}");
	});

	it("should handle empty array", () => {
		expect(formatJson("[]")).toBe("[]");
	});

	it("should handle string values", () => {
		expect(formatJson('"hello"')).toBe('"hello"');
	});

	it("should handle null", () => {
		expect(formatJson("null")).toBe("null");
	});

	it("should handle boolean values", () => {
		expect(formatJson("true")).toBe("true");
		expect(formatJson("false")).toBe("false");
	});

	it("should handle numeric values", () => {
		expect(formatJson("42")).toBe("42");
	});
});

describe("minifyJson", () => {
	it("should minify formatted JSON", () => {
		const input = '{\n  "a": 1,\n  "b": 2\n}';
		const result = minifyJson(input);
		expect(result).toBe('{"a":1,"b":2}');
	});

	it("should minify already minified JSON (idempotent)", () => {
		const input = '{"a":1}';
		expect(minifyJson(input)).toBe('{"a":1}');
	});

	it("should minify arrays", () => {
		const input = "[\n  1,\n  2,\n  3\n]";
		expect(minifyJson(input)).toBe("[1,2,3]");
	});

	it("should throw on invalid JSON", () => {
		expect(() => minifyJson("not json")).toThrow();
	});

	it("should handle deeply nested JSON", () => {
		const input = '{"a": {"b": {"c": [1, 2, {"d": true}]}}}';
		expect(minifyJson(input)).toBe('{"a":{"b":{"c":[1,2,{"d":true}]}}}');
	});
});

describe("validateJson", () => {
	it("should return valid for correct JSON", () => {
		const result = validateJson('{"key": "value"}');
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should return valid for arrays", () => {
		expect(validateJson("[1,2,3]").valid).toBe(true);
	});

	it("should return valid for primitives", () => {
		expect(validateJson('"hello"').valid).toBe(true);
		expect(validateJson("42").valid).toBe(true);
		expect(validateJson("true").valid).toBe(true);
		expect(validateJson("null").valid).toBe(true);
	});

	it("should return invalid for malformed JSON", () => {
		const result = validateJson("{invalid}");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.error?.length).toBeGreaterThan(0);
	});

	it("should return invalid for trailing comma", () => {
		const result = validateJson('{"a": 1,}');
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("should return invalid for single quotes", () => {
		const result = validateJson("{'key': 'value'}");
		expect(result.valid).toBe(false);
	});

	it("should return invalid for empty string", () => {
		const result = validateJson("");
		expect(result.valid).toBe(false);
	});

	it("should return invalid for plain text", () => {
		const result = validateJson("hello world");
		expect(result.valid).toBe(false);
	});

	it("should return invalid for truncated JSON", () => {
		const result = validateJson('{"key": "val');
		expect(result.valid).toBe(false);
	});
});

describe("computeJsonStats", () => {
	it("should compute stats for an object", () => {
		const stats = computeJsonStats('{"a": 1, "b": 2, "c": 3}');
		expect(stats).not.toBeNull();
		expect(stats?.rootType).toBe("object");
		expect(stats?.topLevelEntries).toBe(3);
		expect(stats?.maxDepth).toBe(1);
		expect(stats?.sizeBytes).toBeGreaterThan(0);
	});

	it("should compute stats for an array", () => {
		const stats = computeJsonStats("[1, 2, 3, 4]");
		expect(stats).not.toBeNull();
		expect(stats?.rootType).toBe("array");
		expect(stats?.topLevelEntries).toBe(4);
		expect(stats?.maxDepth).toBe(1);
	});

	it("should compute depth for nested structures", () => {
		const stats = computeJsonStats('{"a": {"b": {"c": 1}}}');
		expect(stats).not.toBeNull();
		expect(stats?.maxDepth).toBe(3);
	});

	it("should compute depth for nested arrays", () => {
		const stats = computeJsonStats("[[1, [2, [3]]]]");
		expect(stats).not.toBeNull();
		expect(stats?.maxDepth).toBe(4);
	});

	it("should return rootType string for a string value", () => {
		const stats = computeJsonStats('"hello"');
		expect(stats).not.toBeNull();
		expect(stats?.rootType).toBe("string");
		expect(stats?.topLevelEntries).toBe(0);
		expect(stats?.maxDepth).toBe(0);
	});

	it("should return rootType number for a numeric value", () => {
		const stats = computeJsonStats("42");
		expect(stats?.rootType).toBe("number");
	});

	it("should return rootType boolean for a boolean value", () => {
		const stats = computeJsonStats("true");
		expect(stats?.rootType).toBe("boolean");
	});

	it("should return rootType null for null", () => {
		const stats = computeJsonStats("null");
		expect(stats?.rootType).toBe("null");
	});

	it("should return null for invalid JSON", () => {
		const stats = computeJsonStats("{invalid}");
		expect(stats).toBeNull();
	});

	it("should handle empty object", () => {
		const stats = computeJsonStats("{}");
		expect(stats?.rootType).toBe("object");
		expect(stats?.topLevelEntries).toBe(0);
		expect(stats?.maxDepth).toBe(1);
	});

	it("should handle empty array", () => {
		const stats = computeJsonStats("[]");
		expect(stats?.rootType).toBe("array");
		expect(stats?.topLevelEntries).toBe(0);
		expect(stats?.maxDepth).toBe(1);
	});
});

describe("MAX_JSON_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_JSON_SIZE).toBe(10 * 1024 * 1024);
	});
});
