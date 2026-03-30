import { describe, expect, it } from "vitest";
import {
	computeDiff,
	LARGE_INPUT_THRESHOLD,
	MAX_TEXT_SIZE,
} from "~/features/developer-tools/processors/text-diff";

describe("computeDiff", () => {
	it("should detect a modified, added, and unchanged lines", () => {
		const result = computeDiff(
			"line1\nline2\nline3",
			"line1\nline2modified\nline3\nline4",
		);

		expect(result.identical).toBe(false);

		// line1: equal
		const line1 = result.lines.find(
			(l) => l.content === "line1" && l.type === "equal",
		);
		expect(line1).toBeDefined();

		// line2: removed
		const line2Removed = result.lines.find(
			(l) => l.content === "line2" && l.type === "removed",
		);
		expect(line2Removed).toBeDefined();

		// line2modified: added
		const line2Added = result.lines.find(
			(l) => l.content === "line2modified" && l.type === "added",
		);
		expect(line2Added).toBeDefined();

		// line3: equal
		const line3 = result.lines.find(
			(l) => l.content === "line3" && l.type === "equal",
		);
		expect(line3).toBeDefined();

		// line4: added
		const line4 = result.lines.find(
			(l) => l.content === "line4" && l.type === "added",
		);
		expect(line4).toBeDefined();

		// stats
		expect(result.stats.added).toBe(2);
		expect(result.stats.removed).toBe(1);
		expect(result.stats.unchanged).toBe(2);
	});

	it("should return identical true for identical inputs", () => {
		const result = computeDiff("hello\nworld", "hello\nworld");

		expect(result.identical).toBe(true);
		expect(result.stats.added).toBe(0);
		expect(result.stats.removed).toBe(0);
		expect(result.stats.unchanged).toBe(2);
		expect(result.lines).toHaveLength(2);
		expect(result.lines[0].type).toBe("equal");
		expect(result.lines[1].type).toBe("equal");
	});

	it("should handle two empty strings", () => {
		const result = computeDiff("", "");

		expect(result.identical).toBe(true);
		expect(result.stats.added).toBe(0);
		expect(result.stats.removed).toBe(0);
		// An empty string splits into one empty-string line
		expect(result.stats.unchanged).toBe(1);
	});

	it("should handle left empty, right non-empty", () => {
		const result = computeDiff("", "line1\nline2");

		expect(result.identical).toBe(false);
		expect(result.stats.removed).toBe(1); // the empty-string line
		expect(result.stats.added).toBe(2);
		expect(result.stats.unchanged).toBe(0);
	});

	it("should handle left non-empty, right empty", () => {
		const result = computeDiff("line1\nline2", "");

		expect(result.identical).toBe(false);
		expect(result.stats.removed).toBe(2);
		expect(result.stats.added).toBe(1); // the empty-string line
		expect(result.stats.unchanged).toBe(0);
	});

	it("should handle single line change", () => {
		const result = computeDiff("old line", "new line");

		expect(result.identical).toBe(false);
		expect(result.stats.removed).toBe(1);
		expect(result.stats.added).toBe(1);
		expect(result.stats.unchanged).toBe(0);
	});

	it("should handle single line identical", () => {
		const result = computeDiff("same", "same");

		expect(result.identical).toBe(true);
		expect(result.stats.unchanged).toBe(1);
	});

	it("should assign correct line numbers", () => {
		const result = computeDiff("a\nb\nc", "a\nx\nc");

		// a is equal: left=1, right=1
		const lineA = result.lines.find((l) => l.content === "a");
		expect(lineA?.leftLineNum).toBe(1);
		expect(lineA?.rightLineNum).toBe(1);

		// b is removed: left=2
		const lineB = result.lines.find((l) => l.content === "b");
		expect(lineB?.type).toBe("removed");
		expect(lineB?.leftLineNum).toBe(2);
		expect(lineB?.rightLineNum).toBeUndefined();

		// x is added: right=2
		const lineX = result.lines.find((l) => l.content === "x");
		expect(lineX?.type).toBe("added");
		expect(lineX?.rightLineNum).toBe(2);
		expect(lineX?.leftLineNum).toBeUndefined();

		// c is equal: left=3, right=3
		const lineC = result.lines.find((l) => l.content === "c");
		expect(lineC?.leftLineNum).toBe(3);
		expect(lineC?.rightLineNum).toBe(3);
	});

	it("should handle multiple consecutive additions", () => {
		const result = computeDiff("a", "a\nb\nc\nd");

		expect(result.stats.added).toBe(3);
		expect(result.stats.removed).toBe(0);
		expect(result.stats.unchanged).toBe(1);
	});

	it("should handle multiple consecutive removals", () => {
		const result = computeDiff("a\nb\nc\nd", "a");

		expect(result.stats.added).toBe(0);
		expect(result.stats.removed).toBe(3);
		expect(result.stats.unchanged).toBe(1);
	});

	it("should handle completely different content", () => {
		const result = computeDiff("alpha\nbeta", "gamma\ndelta");

		expect(result.identical).toBe(false);
		expect(result.stats.removed).toBe(2);
		expect(result.stats.added).toBe(2);
		expect(result.stats.unchanged).toBe(0);
	});
});

describe("constants", () => {
	it("MAX_TEXT_SIZE should be 10 MB", () => {
		expect(MAX_TEXT_SIZE).toBe(10 * 1024 * 1024);
	});

	it("LARGE_INPUT_THRESHOLD should be 10000", () => {
		expect(LARGE_INPUT_THRESHOLD).toBe(10_000);
	});
});
