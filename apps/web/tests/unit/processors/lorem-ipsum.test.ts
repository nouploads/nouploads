import { describe, expect, it } from "vitest";
import {
	countChars,
	countWords,
	generateParagraphs,
	generateSentences,
	generateWords,
} from "~/features/developer-tools/processors/lorem-ipsum";

describe("generateParagraphs", () => {
	it("should return the requested number of paragraphs", () => {
		const text = generateParagraphs(5, true);
		const paragraphs = text.split("\n\n");
		expect(paragraphs).toHaveLength(5);
	});

	it("should start with classic opening when classicStart is true", () => {
		const text = generateParagraphs(5, true);
		expect(text).toMatch(/^Lorem ipsum dolor sit amet/);
	});

	it("should not always start with classic opening when classicStart is false", () => {
		let foundNonClassic = false;
		for (let i = 0; i < 20; i++) {
			const text = generateParagraphs(5, false);
			if (!text.startsWith("Lorem ipsum dolor sit amet")) {
				foundNonClassic = true;
				break;
			}
		}
		expect(foundNonClassic).toBe(true);
	});

	it("should return empty string for count=0", () => {
		const text = generateParagraphs(0, true);
		expect(text).toBe("");
	});

	it("should return one paragraph for count=1", () => {
		const text = generateParagraphs(1, false);
		const paragraphs = text.split("\n\n");
		expect(paragraphs).toHaveLength(1);
		expect(text.length).toBeGreaterThan(0);
	});
});

describe("generateSentences", () => {
	it("should return the requested number of sentences", () => {
		const text = generateSentences(10, false);
		// Each sentence ends with a period followed by space (or end of string)
		const sentences = text.split(/\.\s+/);
		const nonEmpty = sentences.filter((s) => s.trim().length > 0);
		expect(nonEmpty).toHaveLength(10);
	});

	it("should start with classic opening when classicStart is true", () => {
		const text = generateSentences(3, true);
		expect(text).toMatch(/^Lorem ipsum dolor sit amet/);
	});

	it("should return empty string for count=0", () => {
		const text = generateSentences(0, true);
		expect(text).toBe("");
	});
});

describe("generateWords", () => {
	it("should return exactly 100 words", () => {
		const text = generateWords(100, false);
		const words = text.split(/\s+/).filter((w) => w.length > 0);
		expect(words).toHaveLength(100);
	});

	it("should return exactly 1 word", () => {
		const text = generateWords(1, true);
		const words = text.split(/\s+/).filter((w) => w.length > 0);
		expect(words).toHaveLength(1);
	});

	it("should start with lorem when classicStart is true", () => {
		const text = generateWords(10, true);
		expect(text.toLowerCase()).toMatch(/^lorem/);
	});

	it("should return empty string for count=0", () => {
		const text = generateWords(0, true);
		expect(text).toBe("");
	});

	it("should capitalize the first word", () => {
		const text = generateWords(5, false);
		expect(text[0]).toBe(text[0].toUpperCase());
	});
});

describe("countWords", () => {
	it("should count words correctly", () => {
		expect(countWords("hello world")).toBe(2);
		expect(countWords("one two three four five")).toBe(5);
	});

	it("should return 0 for empty string", () => {
		expect(countWords("")).toBe(0);
		expect(countWords("   ")).toBe(0);
	});
});

describe("countChars", () => {
	it("should count characters correctly", () => {
		expect(countChars("hello")).toBe(5);
		expect(countChars("hello world")).toBe(11);
	});

	it("should return 0 for empty string", () => {
		expect(countChars("")).toBe(0);
	});
});
