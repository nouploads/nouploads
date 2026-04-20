import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import {
	computeJsonStats,
	formatJson,
	minifyJson,
	validateJson,
} from "../src/tools/json-formatter.js";

describe("json-formatter tool", () => {
	it("is registered under developer category", () => {
		const tool = getTool("json-formatter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	describe("formatJson", () => {
		it("pretty-prints valid JSON with 2-space indent by default", () => {
			const out = formatJson('{"a":1,"b":[2,3]}');
			expect(out).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
		});

		it("honours a custom indent width", () => {
			const out = formatJson('{"a":1}', 4);
			expect(out).toBe('{\n    "a": 1\n}');
		});

		it("throws on invalid JSON", () => {
			expect(() => formatJson("{bad")).toThrow();
		});
	});

	describe("minifyJson", () => {
		it("removes whitespace", () => {
			expect(minifyJson('{\n  "a": 1 }')).toBe('{"a":1}');
		});
	});

	describe("validateJson", () => {
		it("reports valid: true for good JSON", () => {
			expect(validateJson("[1,2,3]")).toEqual({ valid: true });
		});

		it("reports valid: false with an error message for bad JSON", () => {
			const r = validateJson("{bad");
			expect(r.valid).toBe(false);
			expect(r.error).toBeTruthy();
		});
	});

	describe("computeJsonStats", () => {
		it("reports top-level entries, depth, and root type for an object", () => {
			const stats = computeJsonStats('{"a":1,"b":{"c":2}}');
			expect(stats).not.toBeNull();
			expect(stats?.rootType).toBe("object");
			expect(stats?.topLevelEntries).toBe(2);
			expect(stats?.maxDepth).toBe(2);
		});

		it("returns null on invalid JSON", () => {
			expect(computeJsonStats("{bad")).toBeNull();
		});
	});

	describe("tool.execute()", () => {
		it("formats in 'format' mode", async () => {
			const tool = getTool("json-formatter");
			if (!tool) throw new Error("json-formatter not registered");
			const input = new TextEncoder().encode('{"a":1}');
			const result = await tool.execute(input, { mode: "format" }, {});
			expect(new TextDecoder().decode(result.output)).toBe('{\n  "a": 1\n}');
		});

		it("minifies in 'minify' mode", async () => {
			const tool = getTool("json-formatter");
			if (!tool) throw new Error("json-formatter not registered");
			const input = new TextEncoder().encode('{\n  "a": 1\n}');
			const result = await tool.execute(input, { mode: "minify" }, {});
			expect(new TextDecoder().decode(result.output)).toBe('{"a":1}');
		});
	});
});
