import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/timestamp-converter.js";

describe("timestamp-converter tool", () => {
	it("should be registered", () => {
		const tool = getTool("timestamp-converter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("timestamp-converter");
	});

	it("should convert timestamp 0 to Jan 1 1970", async () => {
		const tool = getTool("timestamp-converter");
		if (!tool) throw new Error("timestamp-converter not registered");

		const input = new TextEncoder().encode("0");
		const result = await tool.execute(input, { mode: "to-date" }, {});

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const parsed = JSON.parse(new TextDecoder().decode(result.output));
		expect(parsed.unix).toBe(0);
		expect(parsed.unixMs).toBe(0);
		expect(parsed.iso8601).toBe("1970-01-01T00:00:00.000Z");
	});

	it("should convert a date string to timestamp", async () => {
		const tool = getTool("timestamp-converter");
		if (!tool) throw new Error("timestamp-converter not registered");

		const input = new TextEncoder().encode("2023-11-14T22:13:20.000Z");
		const result = await tool.execute(input, { mode: "to-timestamp" }, {});

		const parsed = JSON.parse(new TextDecoder().decode(result.output));
		expect(parsed.unix).toBe(1700000000);
		expect(parsed.unixMs).toBe(1700000000000);
	});

	it("should throw on empty input", async () => {
		const tool = getTool("timestamp-converter");
		if (!tool) throw new Error("timestamp-converter not registered");

		const input = new TextEncoder().encode("");
		await expect(tool.execute(input, { mode: "to-date" }, {})).rejects.toThrow(
			"Empty input",
		);
	});

	it("should throw on invalid number for to-date mode", async () => {
		const tool = getTool("timestamp-converter");
		if (!tool) throw new Error("timestamp-converter not registered");

		const input = new TextEncoder().encode("not-a-number");
		await expect(tool.execute(input, { mode: "to-date" }, {})).rejects.toThrow(
			"not a number",
		);
	});

	it("should throw on invalid date for to-timestamp mode", async () => {
		const tool = getTool("timestamp-converter");
		if (!tool) throw new Error("timestamp-converter not registered");

		const input = new TextEncoder().encode("invalid-date-string");
		await expect(
			tool.execute(input, { mode: "to-timestamp" }, {}),
		).rejects.toThrow("Invalid date string");
	});

	it("should auto-detect milliseconds", async () => {
		const tool = getTool("timestamp-converter");
		if (!tool) throw new Error("timestamp-converter not registered");

		const input = new TextEncoder().encode("1700000000000");
		const result = await tool.execute(input, { mode: "to-date" }, {});

		const parsed = JSON.parse(new TextDecoder().decode(result.output));
		// Millisecond input should still resolve to same date
		expect(parsed.unix).toBe(1700000000);
		expect(parsed.unixMs).toBe(1700000000000);
	});
});
