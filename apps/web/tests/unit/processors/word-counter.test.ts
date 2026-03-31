import { describe, expect, it } from "vitest";
import {
	analyzeText,
	countCharacters,
	countCharactersNoSpaces,
	countParagraphs,
	countSentences,
	countWords,
	estimateReadingTime,
} from "~/features/developer-tools/processors/word-counter";

describe("countCharacters", () => {
	it('should count all characters in "Hello world. How are you?"', () => {
		expect(countCharacters("Hello world. How are you?")).toBe(25);
	});

	it("should return 0 for empty string", () => {
		expect(countCharacters("")).toBe(0);
	});

	it("should count whitespace characters", () => {
		expect(countCharacters("a b c")).toBe(5);
	});
});

describe("countCharactersNoSpaces", () => {
	it("should exclude spaces", () => {
		expect(countCharactersNoSpaces("Hello world. How are you?")).toBe(21);
	});

	it("should return 0 for empty string", () => {
		expect(countCharactersNoSpaces("")).toBe(0);
	});

	it("should exclude tabs and newlines", () => {
		expect(countCharactersNoSpaces("a\tb\nc")).toBe(3);
	});
});

describe("countWords", () => {
	it("should count words separated by spaces", () => {
		expect(countWords("Hello world. How are you?")).toBe(5);
	});

	it("should return 0 for empty string", () => {
		expect(countWords("")).toBe(0);
	});

	it("should handle multiple spaces between words", () => {
		expect(countWords("one   two   three")).toBe(3);
	});

	it("should count a single word", () => {
		expect(countWords("hello")).toBe(1);
	});

	it("should handle leading and trailing whitespace", () => {
		expect(countWords("  hello world  ")).toBe(2);
	});

	it("should return 0 for whitespace-only input", () => {
		expect(countWords("   \t\n  ")).toBe(0);
	});
});

describe("countSentences", () => {
	it("should count sentences ending with periods", () => {
		expect(countSentences("Hello world. How are you?")).toBe(2);
	});

	it("should return 0 for empty string", () => {
		expect(countSentences("")).toBe(0);
	});

	it("should count sentences with exclamation marks", () => {
		expect(countSentences("Wow! Amazing! Great.")).toBe(3);
	});

	it("should handle multiple punctuation marks together", () => {
		expect(countSentences("Really?! Yes.")).toBe(2);
	});

	it("should count a single sentence without ending punctuation", () => {
		expect(countSentences("Hello world")).toBe(1);
	});
});

describe("countParagraphs", () => {
	it("should return 1 for a single paragraph", () => {
		expect(countParagraphs("Hello world. How are you?")).toBe(1);
	});

	it("should return 0 for empty string", () => {
		expect(countParagraphs("")).toBe(0);
	});

	it("should count paragraphs separated by double newlines", () => {
		const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
		expect(countParagraphs(text)).toBe(3);
	});

	it("should count 10 paragraphs", () => {
		const paragraphs = Array.from(
			{ length: 10 },
			(_, i) => `Paragraph ${i + 1}.`,
		);
		const text = paragraphs.join("\n\n");
		expect(countParagraphs(text)).toBe(10);
	});

	it("should handle Windows-style line breaks", () => {
		const text = "First.\r\n\r\nSecond.\r\n\r\nThird.";
		expect(countParagraphs(text)).toBe(3);
	});

	it("should not count single newlines as paragraph breaks", () => {
		const text = "Line one.\nLine two.\nLine three.";
		expect(countParagraphs(text)).toBe(1);
	});
});

describe("estimateReadingTime", () => {
	it('should return "0 min" for 0 words', () => {
		expect(estimateReadingTime(0)).toBe("0 min");
	});

	it('should return "< 1 min" for a few words', () => {
		expect(estimateReadingTime(10)).toBe("< 1 min");
	});

	it('should return "~1 min" for 238 words', () => {
		expect(estimateReadingTime(238)).toBe("~1 min");
	});

	it('should return "~2 min" for 476 words', () => {
		expect(estimateReadingTime(476)).toBe("~2 min");
	});

	it('should return "~4 min" for 1000 words', () => {
		expect(estimateReadingTime(1000)).toBe("~4 min");
	});
});

describe("analyzeText", () => {
	it("should return all stats for sample text", () => {
		const stats = analyzeText("Hello world. How are you?");
		expect(stats.characters).toBe(25);
		expect(stats.charactersNoSpaces).toBe(21);
		expect(stats.words).toBe(5);
		expect(stats.sentences).toBe(2);
		expect(stats.paragraphs).toBe(1);
		expect(stats.readingTime).toBe("< 1 min");
	});

	it("should return all zeros for empty string", () => {
		const stats = analyzeText("");
		expect(stats.characters).toBe(0);
		expect(stats.charactersNoSpaces).toBe(0);
		expect(stats.words).toBe(0);
		expect(stats.sentences).toBe(0);
		expect(stats.paragraphs).toBe(0);
		expect(stats.readingTime).toBe("0 min");
	});

	it("should handle text with multiple spaces and newlines", () => {
		const stats = analyzeText("  hello   world  \n\n  foo  ");
		expect(stats.words).toBe(3);
		expect(stats.paragraphs).toBe(2);
	});
});
