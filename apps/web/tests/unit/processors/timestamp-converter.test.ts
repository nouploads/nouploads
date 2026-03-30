import { describe, expect, it } from "vitest";
import {
	fromDate,
	fromTimestamp,
	getNow,
	isMilliseconds,
	toRelative,
} from "~/features/developer-tools/processors/timestamp-converter";

describe("fromTimestamp", () => {
	it("should convert epoch 0 to Jan 1 1970", () => {
		const result = fromTimestamp(0);
		expect(result.unix).toBe(0);
		expect(result.unixMs).toBe(0);
		expect(result.iso8601).toBe("1970-01-01T00:00:00.000Z");
		expect(result.rfc2822).toContain("1970");
		expect(result.utc).toContain("1970");
	});

	it("should convert 1700000000 to November 2023", () => {
		const result = fromTimestamp(1700000000);
		expect(result.unix).toBe(1700000000);
		expect(result.unixMs).toBe(1700000000000);
		expect(result.iso8601).toContain("2023-11-14");
		expect(result.date).toBe("2023-11-14");
	});

	it("should handle millisecond timestamps", () => {
		const result = fromTimestamp(1700000000000);
		expect(result.unix).toBe(1700000000);
		expect(result.unixMs).toBe(1700000000000);
		expect(result.iso8601).toContain("2023-11-14");
	});

	it("should handle negative timestamps (before epoch)", () => {
		const result = fromTimestamp(-86400);
		expect(result.iso8601).toContain("1969-12-31");
	});

	it("should throw on NaN", () => {
		expect(() => fromTimestamp(Number.NaN)).toThrow("Invalid timestamp");
	});

	it("should throw on Infinity", () => {
		expect(() => fromTimestamp(Number.POSITIVE_INFINITY)).toThrow(
			"Invalid timestamp",
		);
	});

	it("should return valid date and time parts", () => {
		const result = fromTimestamp(1700000000);
		expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(result.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});
});

describe("fromDate", () => {
	it("should parse ISO 8601 string", () => {
		const result = fromDate("2023-11-14T22:13:20.000Z");
		expect(result.unix).toBe(1700000000);
		expect(result.unixMs).toBe(1700000000000);
	});

	it("should parse a simple date string", () => {
		const result = fromDate("2023-11-14");
		expect(result.iso8601).toContain("2023-11-14");
	});

	it("should throw on empty string", () => {
		expect(() => fromDate("")).toThrow("Empty date string");
	});

	it("should throw on whitespace-only string", () => {
		expect(() => fromDate("   ")).toThrow("Empty date string");
	});

	it("should throw on invalid date string", () => {
		expect(() => fromDate("not-a-date")).toThrow("Invalid date string");
	});

	it("should round-trip with fromTimestamp", () => {
		const original = fromTimestamp(1700000000);
		const roundTrip = fromDate(original.iso8601);
		expect(roundTrip.unix).toBe(original.unix);
		expect(roundTrip.unixMs).toBe(original.unixMs);
		expect(roundTrip.iso8601).toBe(original.iso8601);
	});
});

describe("isMilliseconds", () => {
	it("should return false for seconds-range values", () => {
		expect(isMilliseconds(1700000000)).toBe(false);
		expect(isMilliseconds(0)).toBe(false);
		expect(isMilliseconds(999999999999)).toBe(false);
	});

	it("should return true for millisecond-range values", () => {
		expect(isMilliseconds(1700000000000)).toBe(true);
		expect(isMilliseconds(1000000000001)).toBe(true);
	});

	it("should handle negative values", () => {
		expect(isMilliseconds(-1700000000)).toBe(false);
		expect(isMilliseconds(-1700000000000)).toBe(true);
	});
});

describe("toRelative", () => {
	it("should return a non-empty string", () => {
		const date = new Date();
		const result = toRelative(date);
		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});

	it("should say 'just now' for the current time", () => {
		const result = toRelative(new Date());
		expect(result).toBe("just now");
	});

	it("should say 'ago' for past dates", () => {
		const past = new Date(Date.now() - 3600 * 1000);
		const result = toRelative(past);
		expect(result).toContain("ago");
	});

	it("should say 'in' for future dates", () => {
		const future = new Date(Date.now() + 3600 * 1000);
		const result = toRelative(future);
		expect(result).toMatch(/^in /);
	});
});

describe("getNow", () => {
	it("should return a result with the current time", () => {
		const before = Math.floor(Date.now() / 1000);
		const result = getNow();
		const after = Math.floor(Date.now() / 1000);

		expect(result.unix).toBeGreaterThanOrEqual(before);
		expect(result.unix).toBeLessThanOrEqual(after);
		expect(result.iso8601).toBeTruthy();
		expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});
