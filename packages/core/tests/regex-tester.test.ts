import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/regex-tester.js";

describe("regex-tester tool", () => {
	it("should be registered", () => {
		const tool = getTool("regex-tester");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("regex-tester");
	});

	it("should find matches with a simple pattern", async () => {
		const tool = getTool("regex-tester");
		if (!tool) throw new Error("regex-tester not registered");

		const input = new TextEncoder().encode("hello world hello");
		const result = await tool.execute(
			input,
			{ pattern: "hello", flags: "g" },
			{},
		);

		const output = JSON.parse(new TextDecoder().decode(result.output));
		expect(output.matchCount).toBe(2);
		expect(output.matches[0].fullMatch).toBe("hello");
		expect(output.matches[0].index).toBe(0);
		expect(output.matches[1].index).toBe(12);
	});

	it("should extract capture groups", async () => {
		const tool = getTool("regex-tester");
		if (!tool) throw new Error("regex-tester not registered");

		const input = new TextEncoder().encode("2025-01-15");
		const result = await tool.execute(
			input,
			{ pattern: "(\\d{4})-(\\d{2})-(\\d{2})", flags: "g" },
			{},
		);

		const output = JSON.parse(new TextDecoder().decode(result.output));
		expect(output.matchCount).toBe(1);
		expect(output.matches[0].groups).toEqual(["2025", "01", "15"]);
	});

	it("should throw when no pattern is provided", async () => {
		const tool = getTool("regex-tester");
		if (!tool) throw new Error("regex-tester not registered");

		await expect(
			tool.execute(
				new TextEncoder().encode("test"),
				{ pattern: "", flags: "g" },
				{},
			),
		).rejects.toThrow("No pattern provided");
	});

	it("should return JSON output", async () => {
		const tool = getTool("regex-tester");
		if (!tool) throw new Error("regex-tester not registered");

		const result = await tool.execute(
			new TextEncoder().encode("abc"),
			{ pattern: "b", flags: "g" },
			{},
		);

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");
	});
});
