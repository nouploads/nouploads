import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/word-counter.js";

describe("word-counter tool", () => {
	it("should be registered", () => {
		const tool = getTool("word-counter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should analyze sample text and return stats", async () => {
		const tool = getTool("word-counter");
		if (!tool) throw new Error("word-counter not registered");

		const text = "Hello world. How are you?";
		const input = new TextEncoder().encode(text);
		const result = await tool.execute(input, {}, {});

		expect(result.extension).toBe(".json");
		expect(result.mimeType).toBe("application/json");

		const stats = JSON.parse(new TextDecoder().decode(result.output));
		expect(stats.characters).toBe(25);
		expect(stats.charactersNoSpaces).toBe(21);
		expect(stats.words).toBe(5);
		expect(stats.sentences).toBe(2);
		expect(stats.paragraphs).toBe(1);
		expect(stats.readingTime).toBe("< 1 min");
	});

	it("should handle empty input", async () => {
		const tool = getTool("word-counter");
		if (!tool) throw new Error("word-counter not registered");

		const result = await tool.execute(new Uint8Array([]), {}, {});
		const stats = JSON.parse(new TextDecoder().decode(result.output));

		expect(stats.characters).toBe(0);
		expect(stats.charactersNoSpaces).toBe(0);
		expect(stats.words).toBe(0);
		expect(stats.sentences).toBe(0);
		expect(stats.paragraphs).toBe(0);
		expect(stats.readingTime).toBe("0 min");
	});

	it("should return stats in metadata", async () => {
		const tool = getTool("word-counter");
		if (!tool) throw new Error("word-counter not registered");

		const text = "One two three.";
		const input = new TextEncoder().encode(text);
		const result = await tool.execute(input, {}, {});

		expect(result.metadata).toBeDefined();
		expect(result.metadata?.words).toBe(3);
		expect(result.metadata?.sentences).toBe(1);
	});
});
