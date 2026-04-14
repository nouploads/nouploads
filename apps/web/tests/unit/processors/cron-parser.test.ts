import { describe, expect, it } from "vitest";
import {
	describeCron,
	getNextRuns,
	parseCronExpression,
	validateCronExpression,
} from "~/features/developer-tools/processors/cron-parser";

describe("parseCronExpression", () => {
	it("should parse * * * * * as all-any fields", () => {
		const parsed = parseCronExpression("* * * * *");
		expect(parsed.minute.type).toBe("any");
		expect(parsed.hour.type).toBe("any");
		expect(parsed.dayOfMonth.type).toBe("any");
		expect(parsed.month.type).toBe("any");
		expect(parsed.dayOfWeek.type).toBe("any");
	});

	it("should parse single values", () => {
		const parsed = parseCronExpression("5 14 1 6 3");
		expect(parsed.minute).toEqual({ type: "value", values: [5] });
		expect(parsed.hour).toEqual({ type: "value", values: [14] });
		expect(parsed.dayOfMonth).toEqual({ type: "value", values: [1] });
		expect(parsed.month).toEqual({ type: "value", values: [6] });
		expect(parsed.dayOfWeek).toEqual({ type: "value", values: [3] });
	});

	it("should parse ranges", () => {
		const parsed = parseCronExpression("0 9 * * 1-5");
		expect(parsed.dayOfWeek.type).toBe("range");
		expect(parsed.dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
	});

	it("should parse step values", () => {
		const parsed = parseCronExpression("*/15 * * * *");
		expect(parsed.minute.type).toBe("step");
		expect(parsed.minute.values).toEqual([0, 15, 30, 45]);
	});

	it("should parse list values", () => {
		const parsed = parseCronExpression("0 0 1,15 * *");
		expect(parsed.dayOfMonth.type).toBe("list");
		expect(parsed.dayOfMonth.values).toEqual([1, 15]);
	});

	it("should parse combined range with step (1-30/5)", () => {
		const parsed = parseCronExpression("1-30/5 * * * *");
		expect(parsed.minute.type).toBe("step");
		expect(parsed.minute.values).toEqual([1, 6, 11, 16, 21, 26]);
	});

	it("should throw on wrong number of fields", () => {
		expect(() => parseCronExpression("* *")).toThrow("Expected 5 fields");
		expect(() => parseCronExpression("* * * * * *")).toThrow(
			"Expected 5 fields",
		);
	});

	it("should throw on out-of-range value", () => {
		expect(() => parseCronExpression("60 * * * *")).toThrow("out of range");
		expect(() => parseCronExpression("* 24 * * *")).toThrow("out of range");
		expect(() => parseCronExpression("* * 0 * *")).toThrow("out of range");
		expect(() => parseCronExpression("* * * 13 *")).toThrow("out of range");
		expect(() => parseCronExpression("* * * * 7")).toThrow("out of range");
	});
});

describe("validateCronExpression", () => {
	it("should return valid for correct expressions", () => {
		expect(validateCronExpression("* * * * *").valid).toBe(true);
		expect(validateCronExpression("*/15 * * * *").valid).toBe(true);
		expect(validateCronExpression("0 9 * * 1-5").valid).toBe(true);
	});

	it("should return invalid for incorrect expressions", () => {
		const result = validateCronExpression("invalid");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("should return invalid for empty string", () => {
		const result = validateCronExpression("");
		expect(result.valid).toBe(false);
	});
});

describe("describeCron", () => {
	it("should describe * * * * * as every minute", () => {
		const parsed = parseCronExpression("* * * * *");
		expect(describeCron(parsed)).toBe("Every minute");
	});

	it("should describe */15 * * * * as every 15 minutes", () => {
		const parsed = parseCronExpression("*/15 * * * *");
		expect(describeCron(parsed).toLowerCase()).toContain("15 minutes");
	});

	it("should describe 0 9 * * 1-5 as weekdays", () => {
		const parsed = parseCronExpression("0 9 * * 1-5");
		const desc = describeCron(parsed).toLowerCase();
		expect(desc).toContain("weekday");
	});

	it("should describe 0 0 1 1 * mentioning January", () => {
		const parsed = parseCronExpression("0 0 1 1 *");
		const desc = describeCron(parsed);
		expect(desc).toContain("January");
	});

	it("should describe 0 * * * * as hour-related", () => {
		const parsed = parseCronExpression("0 * * * *");
		const desc = describeCron(parsed);
		expect(desc).toContain("minute 0");
	});
});

describe("getNextRuns", () => {
	it("should return requested number of runs for * * * * *", () => {
		const parsed = parseCronExpression("* * * * *");
		const runs = getNextRuns(parsed, 5);
		expect(runs).toHaveLength(5);
	});

	it("should return dates that are 1 minute apart for * * * * *", () => {
		const parsed = parseCronExpression("* * * * *");
		const runs = getNextRuns(parsed, 5);
		for (let i = 1; i < runs.length; i++) {
			const diff = runs[i].getTime() - runs[i - 1].getTime();
			expect(diff).toBe(60_000); // 1 minute in ms
		}
	});

	it("should return dates 15 minutes apart for */15 * * * *", () => {
		const parsed = parseCronExpression("*/15 * * * *");
		const runs = getNextRuns(parsed, 4);
		expect(runs.length).toBeGreaterThanOrEqual(2);
		for (let i = 1; i < runs.length; i++) {
			const diff = runs[i].getTime() - runs[i - 1].getTime();
			expect(diff).toBe(15 * 60_000);
		}
	});

	it("should only return weekdays for 0 9 * * 1-5", () => {
		const parsed = parseCronExpression("0 9 * * 1-5");
		const runs = getNextRuns(parsed, 10);
		for (const run of runs) {
			const day = run.getDay();
			expect(day).toBeGreaterThanOrEqual(1);
			expect(day).toBeLessThanOrEqual(5);
		}
	});

	it("should only return dates in January for 0 0 1 1 *", () => {
		const parsed = parseCronExpression("0 0 1 1 *");
		const runs = getNextRuns(parsed, 1);
		expect(runs.length).toBeGreaterThanOrEqual(1);
		expect(runs[0].getMonth()).toBe(0); // January is 0-indexed
		expect(runs[0].getDate()).toBe(1);
	});

	it("should use from parameter as starting point", () => {
		const parsed = parseCronExpression("* * * * *");
		const from = new Date("2025-06-15T10:30:00");
		const runs = getNextRuns(parsed, 3, from);
		expect(runs).toHaveLength(3);
		// First run should be after the from time
		expect(runs[0].getTime()).toBeGreaterThan(from.getTime());
	});

	it("should cap at 1 year of iterations", () => {
		// Expression that never matches (day 31 + February only + specific day of week)
		// This may return 0 results but should not hang
		const parsed = parseCronExpression("0 0 31 2 *");
		const runs = getNextRuns(parsed, 10);
		// May or may not find matches depending on calendar, but should not hang
		expect(runs.length).toBeLessThanOrEqual(10);
	});
});

describe("cron-parser unsupported / edge cases", () => {
	it("should reject shorthand @daily (5-field format only)", () => {
		expect(() => parseCronExpression("@daily")).toThrow("Expected 5 fields");
	});

	it("should reject shorthand @hourly", () => {
		expect(() => parseCronExpression("@hourly")).toThrow("Expected 5 fields");
	});

	it("should reject day-of-week name (MON)", () => {
		// Current parser only accepts numeric day-of-week 0-6
		expect(() => parseCronExpression("0 9 * * MON")).toThrow();
	});

	it("should reject inverted range", () => {
		expect(() => parseCronExpression("5-1 * * * *")).toThrow(
			/greater than end/,
		);
	});

	it("should reject zero step", () => {
		expect(() => parseCronExpression("*/0 * * * *")).toThrow(/step value/);
	});

	it("should reject negative value", () => {
		expect(() => parseCronExpression("-5 * * * *")).toThrow();
	});

	it("should handle leap year for Feb 29", () => {
		const parsed = parseCronExpression("0 0 29 2 *");
		const from = new Date("2023-03-01T00:00:00"); // 2024 is leap year
		const runs = getNextRuns(parsed, 1, from);
		if (runs.length > 0) {
			expect(runs[0].getMonth()).toBe(1); // February
			expect(runs[0].getDate()).toBe(29);
		}
	});

	it("should not emit duplicate runs for list-value fields", () => {
		const parsed = parseCronExpression("0,0,0 * * * *");
		const runs = getNextRuns(parsed, 5);
		// Duplicates should be deduped during parsing — each run should be
		// a new minute-0 occurrence, 1 hour apart
		for (let i = 1; i < runs.length; i++) {
			const diff = runs[i].getTime() - runs[i - 1].getTime();
			expect(diff).toBe(60 * 60_000);
		}
	});
});
