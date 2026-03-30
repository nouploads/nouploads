import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/uuid-generator.js";

const UUID_V4_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V7_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuid-generator tool", () => {
	it("should be registered", () => {
		const tool = getTool("uuid-generator");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should generate a valid v4 UUID by default", async () => {
		const tool = getTool("uuid-generator");
		if (!tool) throw new Error("uuid-generator not registered");

		const result = await tool.execute(new Uint8Array([]), {}, {});
		expect(result.extension).toBe(".txt");
		expect(result.mimeType).toBe("text/plain");

		const text = new TextDecoder().decode(result.output);
		expect(text).toMatch(UUID_V4_REGEX);
	});

	it("should generate a valid v7 UUID when version is v7", async () => {
		const tool = getTool("uuid-generator");
		if (!tool) throw new Error("uuid-generator not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ version: "v7" },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		expect(text).toMatch(UUID_V7_REGEX);
	});

	it("should generate multiple UUIDs when count > 1", async () => {
		const tool = getTool("uuid-generator");
		if (!tool) throw new Error("uuid-generator not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ version: "v4", count: 5 },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		const lines = text.split("\n");
		expect(lines).toHaveLength(5);
		for (const line of lines) {
			expect(line).toMatch(UUID_V4_REGEX);
		}
	});

	it("should clamp count to 1000", async () => {
		const tool = getTool("uuid-generator");
		if (!tool) throw new Error("uuid-generator not registered");

		const result = await tool.execute(new Uint8Array([]), { count: 5000 }, {});
		const text = new TextDecoder().decode(result.output);
		const lines = text.split("\n");
		expect(lines).toHaveLength(1000);
	});
});
