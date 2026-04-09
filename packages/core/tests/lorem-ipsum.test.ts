import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/lorem-ipsum.js";

describe("lorem-ipsum tool", () => {
	it("should be registered", () => {
		const tool = getTool("lorem-ipsum");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("should generate paragraphs by default", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		const result = await tool.execute(new Uint8Array([]), { count: 3 }, {});
		expect(result.extension).toBe(".txt");
		expect(result.mimeType).toBe("text/plain");

		const text = new TextDecoder().decode(result.output);
		const paragraphs = text.split("\n\n");
		expect(paragraphs).toHaveLength(3);
	});

	it("should generate correct number of sentences", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ mode: "sentences", count: 7 },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		// Each sentence ends with a period
		const sentences = text.split(/\.\s+/);
		// Last element may or may not have trailing period, so filter empties
		const nonEmpty = sentences.filter((s) => s.trim().length > 0);
		expect(nonEmpty).toHaveLength(7);
	});

	it("should generate exact word count", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ mode: "words", count: 50 },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		const words = text.split(/\s+/).filter((w) => w.length > 0);
		expect(words).toHaveLength(50);
	});

	it("should start with classic opening when classicStart is true", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ mode: "paragraphs", count: 1, classicStart: true },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		expect(text).toMatch(/^Lorem ipsum dolor sit amet/);
	});

	it("should not always start with classic opening when classicStart is false", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		// Run multiple times — at least one should not start with "Lorem ipsum"
		let foundNonClassic = false;
		for (let i = 0; i < 20; i++) {
			const result = await tool.execute(
				new Uint8Array([]),
				{ mode: "sentences", count: 1, classicStart: false },
				{},
			);
			const text = new TextDecoder().decode(result.output);
			if (!text.startsWith("Lorem ipsum dolor sit amet")) {
				foundNonClassic = true;
				break;
			}
		}
		expect(foundNonClassic).toBe(true);
	});

	it("should clamp count to 100", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ mode: "paragraphs", count: 500 },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		const paragraphs = text.split("\n\n");
		expect(paragraphs).toHaveLength(100);
	});

	it("should clamp count to minimum of 1", async () => {
		const tool = getTool("lorem-ipsum");
		if (!tool) throw new Error("lorem-ipsum not registered");

		const result = await tool.execute(
			new Uint8Array([]),
			{ mode: "paragraphs", count: -5 },
			{},
		);
		const text = new TextDecoder().decode(result.output);
		const paragraphs = text.split("\n\n");
		expect(paragraphs).toHaveLength(1);
	});
});
