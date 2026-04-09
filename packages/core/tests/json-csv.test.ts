import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/json-csv.js";

describe("json-csv tool", () => {
	it("should be registered", () => {
		const tool = getTool("json-csv");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("json-csv");
	});

	it("should convert a simple JSON array to CSV", async () => {
		const tool = getTool("json-csv");
		if (!tool) throw new Error("json-csv not registered");

		const input = JSON.stringify([
			{ name: "Alice", age: 30 },
			{ name: "Bob", age: 25 },
		]);
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ direction: "json-to-csv" },
			{},
		);

		expect(result.extension).toBe(".csv");
		expect(result.mimeType).toBe("text/csv");

		const csv = new TextDecoder().decode(result.output);
		expect(csv).toContain("name");
		expect(csv).toContain("age");
		expect(csv).toContain("Alice");
		expect(csv).toContain("Bob");
	});

	it("should convert CSV back to JSON", async () => {
		const tool = getTool("json-csv");
		if (!tool) throw new Error("json-csv not registered");

		const input = "name,age\nAlice,30\nBob,25";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ direction: "csv-to-json" },
			{},
		);

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const parsed = JSON.parse(new TextDecoder().decode(result.output));
		expect(parsed).toHaveLength(2);
		expect(parsed[0].name).toBe("Alice");
		expect(parsed[0].age).toBe("30");
		expect(parsed[1].name).toBe("Bob");
	});

	it("should roundtrip JSON→CSV→JSON", async () => {
		const tool = getTool("json-csv");
		if (!tool) throw new Error("json-csv not registered");

		const original = [
			{ name: "Alice", age: "30" },
			{ name: "Bob", age: "25" },
		];
		const jsonInput = JSON.stringify(original);

		// JSON → CSV
		const csvResult = await tool.execute(
			new TextEncoder().encode(jsonInput),
			{ direction: "json-to-csv" },
			{},
		);
		const csv = new TextDecoder().decode(csvResult.output);

		// CSV → JSON
		const jsonResult = await tool.execute(
			new TextEncoder().encode(csv),
			{ direction: "csv-to-json" },
			{},
		);
		const parsed = JSON.parse(new TextDecoder().decode(jsonResult.output));

		expect(parsed).toEqual(original);
	});
});
