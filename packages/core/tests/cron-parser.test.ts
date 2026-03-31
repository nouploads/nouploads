import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/cron-parser.js";

describe("cron-parser tool", () => {
	it("should be registered", () => {
		const tool = getTool("cron-parser");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should parse */15 * * * * and include '15 minutes' in description", async () => {
		const tool = getTool("cron-parser");
		if (!tool) throw new Error("cron-parser not registered");

		const input = new TextEncoder().encode("*/15 * * * *");
		const result = await tool.execute(input, { count: 5 }, {});
		expect(result.mimeType).toBe("application/json");

		const json = JSON.parse(new TextDecoder().decode(result.output));
		expect(json.description.toLowerCase()).toContain("15 minutes");
		expect(json.nextRuns.length).toBe(5);
	});

	it("should parse 0 9 * * 1-5 as weekday schedule", async () => {
		const tool = getTool("cron-parser");
		if (!tool) throw new Error("cron-parser not registered");

		const input = new TextEncoder().encode("0 9 * * 1-5");
		const result = await tool.execute(input, { count: 10 }, {});
		const json = JSON.parse(new TextDecoder().decode(result.output));

		expect(json.description.toLowerCase()).toContain("weekday");

		// Verify no Saturday (6) or Sunday (0) in next runs
		for (const isoStr of json.nextRuns) {
			const day = new Date(isoStr).getDay();
			expect(day).toBeGreaterThanOrEqual(1);
			expect(day).toBeLessThanOrEqual(5);
		}
	});

	it("should throw on invalid expression", async () => {
		const tool = getTool("cron-parser");
		if (!tool) throw new Error("cron-parser not registered");

		const input = new TextEncoder().encode("invalid");
		await expect(tool.execute(input, {}, {})).rejects.toThrow();
	});

	it("should throw on empty input", async () => {
		const tool = getTool("cron-parser");
		if (!tool) throw new Error("cron-parser not registered");

		const input = new TextEncoder().encode("");
		await expect(tool.execute(input, {}, {})).rejects.toThrow(
			"Empty cron expression",
		);
	});

	it("should clamp count to 50", async () => {
		const tool = getTool("cron-parser");
		if (!tool) throw new Error("cron-parser not registered");

		const input = new TextEncoder().encode("* * * * *");
		const result = await tool.execute(input, { count: 100 }, {});
		const json = JSON.parse(new TextDecoder().decode(result.output));
		expect(json.nextRuns.length).toBe(50);
	});
});
