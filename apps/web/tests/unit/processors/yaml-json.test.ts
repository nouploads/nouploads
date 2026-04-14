import { describe, expect, it } from "vitest";
import {
	detectFormat,
	jsonToYaml,
	MAX_INPUT_SIZE,
	validateJson,
	validateYaml,
	yamlToJson,
} from "~/features/developer-tools/processors/yaml-json";

describe("yamlToJson", () => {
	it("should convert simple YAML to JSON", () => {
		const result = yamlToJson("name: Alice\nage: 30");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.name).toBe("Alice");
		expect(parsed.age).toBe(30);
	});

	it("should convert YAML arrays", () => {
		const result = yamlToJson("items:\n  - a\n  - b\n  - c");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.items).toEqual(["a", "b", "c"]);
	});

	it("should resolve YAML anchors and aliases", () => {
		const yaml =
			"defaults: &defaults\n  color: red\n  size: 10\nitem:\n  <<: *defaults\n  name: First";
		const result = yamlToJson(yaml);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.item.color).toBe("red");
		expect(parsed.item.size).toBe(10);
		expect(parsed.item.name).toBe("First");
	});

	it("should handle nested YAML", () => {
		const yaml = "a:\n  b:\n    c: deep";
		const result = yamlToJson(yaml);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.a.b.c).toBe("deep");
	});

	it("should respect indent option", () => {
		const result = yamlToJson("a: 1", 4);
		expect(result.output).toBe('{\n    "a": 1\n}');
	});

	it("should return error for invalid YAML", () => {
		const result = yamlToJson("key: [unclosed");
		expect(result.error).toBeDefined();
		expect(result.output).toBe("");
	});

	it("should handle empty YAML", () => {
		const result = yamlToJson("");
		expect(result.error).toBeUndefined();
	});

	it("should handle boolean values", () => {
		const result = yamlToJson("active: true\ndeleted: false");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.active).toBe(true);
		expect(parsed.deleted).toBe(false);
	});

	it("should handle null values", () => {
		const result = yamlToJson("value: null\nempty: ~");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.value).toBeNull();
		expect(parsed.empty).toBeNull();
	});
});

describe("jsonToYaml", () => {
	it("should convert simple JSON to YAML", () => {
		const result = jsonToYaml('{"name":"Bob","active":true}');
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("name: Bob");
		expect(result.output).toContain("active: true");
	});

	it("should convert JSON arrays", () => {
		const result = jsonToYaml('{"items":["a","b"]}');
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("- a");
		expect(result.output).toContain("- b");
	});

	it("should handle nested JSON", () => {
		const result = jsonToYaml('{"a":{"b":{"c":"deep"}}}');
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("c: deep");
	});

	it("should return error for invalid JSON", () => {
		const result = jsonToYaml("{invalid}");
		expect(result.error).toBeDefined();
		expect(result.output).toBe("");
	});

	it("should handle empty JSON object", () => {
		const result = jsonToYaml("{}");
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("{}");
	});

	it("should handle null in JSON", () => {
		const result = jsonToYaml('{"key":null}');
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("key: null");
	});
});

describe("detectFormat", () => {
	it("should detect JSON objects", () => {
		expect(detectFormat('{"key": "value"}')).toBe("json");
	});

	it("should detect JSON arrays", () => {
		expect(detectFormat("[1, 2, 3]")).toBe("json");
	});

	it("should detect YAML", () => {
		expect(detectFormat("key: value")).toBe("yaml");
	});

	it("should detect YAML with dashes", () => {
		expect(detectFormat("---\nname: test")).toBe("yaml");
	});

	it("should return unknown for empty string", () => {
		expect(detectFormat("")).toBe("unknown");
	});

	it("should return unknown for whitespace only", () => {
		expect(detectFormat("   ")).toBe("unknown");
	});

	it("should detect JSON with leading whitespace", () => {
		expect(detectFormat('  { "a": 1 }')).toBe("json");
	});
});

describe("validateYaml", () => {
	it("should validate correct YAML", () => {
		const result = validateYaml("key: value\nlist:\n  - item");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should reject invalid YAML", () => {
		const result = validateYaml("key: [unclosed");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});
});

describe("validateJson", () => {
	it("should validate correct JSON", () => {
		const result = validateJson('{"key": "value"}');
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should reject invalid JSON", () => {
		const result = validateJson("{invalid}");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});
});

describe("YAML edge cases", () => {
	it("should parse multi-document YAML (takes first document)", () => {
		// js-yaml's load() returns the first document by default; we document
		// that behavior here so future changes to the parser strategy are caught.
		const input = "---\nname: first\n---\nname: second\n";
		const result = yamlToJson(input);
		// Either an error OR a single first-doc parse is acceptable;
		// assert we don't silently merge documents.
		if (result.error === undefined) {
			const parsed = JSON.parse(result.output);
			expect(parsed).toEqual({ name: "first" });
		} else {
			expect(result.error).toBeDefined();
		}
	});

	it("should handle YAML string tags", () => {
		const input = "value: !!str 42";
		const result = yamlToJson(input);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.value).toBe("42");
	});

	it("should treat YAML numeric tag as a number", () => {
		const input = 'value: !!int "42"';
		const result = yamlToJson(input);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.value).toBe(42);
	});

	it("should preserve insertion order when converting JSON to YAML", () => {
		const result = jsonToYaml('{"z":1,"a":2,"m":3}');
		expect(result.error).toBeUndefined();
		const lines = result.output.trim().split("\n");
		expect(lines[0]).toMatch(/^z:/);
		expect(lines[1]).toMatch(/^a:/);
		expect(lines[2]).toMatch(/^m:/);
	});
});

describe("roundtrip", () => {
	it("should roundtrip YAML -> JSON -> YAML preserving data", () => {
		const original = "name: Alice\nage: 30\nitems:\n  - a\n  - b\n";
		const jsonResult = yamlToJson(original);
		expect(jsonResult.error).toBeUndefined();
		const yamlResult = jsonToYaml(jsonResult.output);
		expect(yamlResult.error).toBeUndefined();
		// Re-parse to compare data, not exact formatting
		const finalJson = yamlToJson(yamlResult.output);
		expect(JSON.parse(finalJson.output)).toEqual(JSON.parse(jsonResult.output));
	});
});

describe("MAX_INPUT_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_INPUT_SIZE).toBe(10 * 1024 * 1024);
	});
});
