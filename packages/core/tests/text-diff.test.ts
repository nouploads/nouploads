import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/text-diff.js";

describe("text-diff tool", () => {
	it("should be registered", () => {
		const tool = getTool("text-diff");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("text-diff");
	});

	it("should diff two different texts", async () => {
		const tool = getTool("text-diff");
		if (!tool) throw new Error("text-diff not registered");

		const input = "line1\nline2\n---SPLIT---\nline1\nline2modified";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const parsed = JSON.parse(new TextDecoder().decode(result.output));
		expect(parsed.identical).toBe(false);
		expect(parsed.stats.removed).toBeGreaterThan(0);
		expect(parsed.stats.added).toBeGreaterThan(0);
		expect(parsed.stats.unchanged).toBeGreaterThan(0);
	});

	it("should detect identical texts", async () => {
		const tool = getTool("text-diff");
		if (!tool) throw new Error("text-diff not registered");

		const input = "same\ntext\n---SPLIT---\nsame\ntext";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, {}, {});

		const parsed = JSON.parse(new TextDecoder().decode(result.output));
		expect(parsed.identical).toBe(true);
		expect(parsed.stats.added).toBe(0);
		expect(parsed.stats.removed).toBe(0);
		expect(parsed.stats.unchanged).toBe(2);
	});

	it("should throw if separator is missing", async () => {
		const tool = getTool("text-diff");
		if (!tool) throw new Error("text-diff not registered");

		const input = "no separator here";
		const encoded = new TextEncoder().encode(input);

		await expect(tool.execute(encoded, {}, {})).rejects.toThrow("---SPLIT---");
	});
});
