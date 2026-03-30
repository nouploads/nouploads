import { describe, expect, it } from "vitest";
import {
	MAX_TEST_STRING_SIZE,
	testRegex,
	validateRegex,
} from "~/features/developer-tools/processors/regex-tester";

describe("testRegex", () => {
	it("should find date matches with capture groups", () => {
		const result = testRegex(
			"(\\d{4})-(\\d{2})-(\\d{2})",
			"g",
			"2025-01-15 and 2025-01-16",
		);

		expect(result.error).toBeNull();
		expect(result.matchCount).toBe(2);

		expect(result.matches[0].fullMatch).toBe("2025-01-15");
		expect(result.matches[0].index).toBe(0);
		expect(result.matches[0].groups).toEqual(["2025", "01", "15"]);

		expect(result.matches[1].fullMatch).toBe("2025-01-16");
		expect(result.matches[1].index).toBe(15);
		expect(result.matches[1].groups).toEqual(["2025", "01", "16"]);
	});

	it("should support case insensitive flag", () => {
		const sensitive = testRegex("hello", "g", "Hello World");
		expect(sensitive.matchCount).toBe(0);

		const insensitive = testRegex("hello", "gi", "Hello World");
		expect(insensitive.matchCount).toBe(1);
		expect(insensitive.matches[0].fullMatch).toBe("Hello");
	});

	it("should return empty matches when no match", () => {
		const result = testRegex("xyz", "g", "hello world");
		expect(result.error).toBeNull();
		expect(result.matchCount).toBe(0);
		expect(result.matches).toEqual([]);
	});

	it("should return empty for empty pattern", () => {
		const result = testRegex("", "g", "hello");
		expect(result.error).toBeNull();
		expect(result.matchCount).toBe(0);
	});

	it("should return error for invalid regex", () => {
		const result = testRegex("(unclosed", "g", "hello");
		expect(result.error).not.toBeNull();
		expect(result.matchCount).toBe(0);
	});

	it("should handle named capture groups", () => {
		const result = testRegex(
			"(?<year>\\d{4})-(?<month>\\d{2})",
			"g",
			"Date: 2025-03",
		);

		expect(result.matchCount).toBe(1);
		expect(result.matches[0].groupNames).toEqual({
			year: "2025",
			month: "03",
		});
		expect(result.matches[0].groups).toEqual(["2025", "03"]);
	});

	it("should add g flag automatically for matchAll", () => {
		const result = testRegex("\\d+", "", "a1 b2 c3");
		expect(result.matchCount).toBe(3);
	});

	it("should handle multiline flag", () => {
		const result = testRegex("^\\w+", "gm", "hello\nworld");
		expect(result.matchCount).toBe(2);
		expect(result.matches[0].fullMatch).toBe("hello");
		expect(result.matches[1].fullMatch).toBe("world");
	});

	it("should handle dotAll flag", () => {
		const withoutS = testRegex("a.b", "g", "a\nb");
		expect(withoutS.matchCount).toBe(0);

		const withS = testRegex("a.b", "gs", "a\nb");
		expect(withS.matchCount).toBe(1);
	});
});

describe("validateRegex", () => {
	it("should return valid for a correct pattern", () => {
		const result = validateRegex("\\d{4}-\\d{2}", "g");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should return invalid for unclosed group", () => {
		const result = validateRegex("(unclosed", "g");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.error?.length).toBeGreaterThan(0);
	});

	it("should return invalid for bad flags", () => {
		const result = validateRegex("abc", "z");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("should return valid for empty pattern", () => {
		const result = validateRegex("", "g");
		expect(result.valid).toBe(true);
	});

	it("should return valid for complex patterns", () => {
		expect(validateRegex("(?<=\\d)(?<name>[a-z]+)(?=\\s)", "gi").valid).toBe(
			true,
		);
	});
});

describe("MAX_TEST_STRING_SIZE", () => {
	it("should be 1 MB", () => {
		expect(MAX_TEST_STRING_SIZE).toBe(1 * 1024 * 1024);
	});
});
