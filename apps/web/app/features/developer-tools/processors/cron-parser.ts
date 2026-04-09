/**
 * CRON expression parser — zero dependencies.
 * Parses standard 5-field cron expressions (minute hour day-of-month month day-of-week),
 * produces human-readable descriptions, and calculates next N run times.
 */

export interface CronField {
	type: "any" | "value" | "range" | "step" | "list";
	values: number[];
}

export interface CronParsed {
	minute: CronField;
	hour: CronField;
	dayOfMonth: CronField;
	month: CronField;
	dayOfWeek: CronField;
}

export interface CronValidationResult {
	valid: boolean;
	error?: string;
}

const FIELD_RANGES: Record<string, [number, number]> = {
	minute: [0, 59],
	hour: [0, 23],
	dayOfMonth: [1, 31],
	month: [1, 12],
	dayOfWeek: [0, 6],
};

const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

const MONTH_NAMES = [
	"",
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function parseField(
	token: string,
	min: number,
	max: number,
	fieldName: string,
): CronField {
	if (token === "*") {
		return { type: "any", values: [] };
	}

	// List: 1,3,5
	if (token.includes(",")) {
		const parts = token.split(",");
		const values: number[] = [];
		for (const part of parts) {
			const sub = parseField(part.trim(), min, max, fieldName);
			values.push(...(sub.type === "any" ? expandRange(min, max) : sub.values));
		}
		const unique = [...new Set(values)].sort((a, b) => a - b);
		return { type: "list", values: unique };
	}

	// Step: */15 or 1-5/2
	if (token.includes("/")) {
		const [rangeStr, stepStr] = token.split("/");
		const step = Number.parseInt(stepStr, 10);
		if (Number.isNaN(step) || step < 1) {
			throw new Error(`Invalid step value "${stepStr}" in ${fieldName} field`);
		}
		let rangeMin = min;
		let rangeMax = max;
		if (rangeStr !== "*") {
			if (rangeStr.includes("-")) {
				const [lo, hi] = rangeStr.split("-").map(Number);
				rangeMin = lo;
				rangeMax = hi;
			} else {
				rangeMin = Number.parseInt(rangeStr, 10);
			}
		}
		validateRange(rangeMin, rangeMax, min, max, fieldName);
		const values: number[] = [];
		for (let i = rangeMin; i <= rangeMax; i += step) {
			values.push(i);
		}
		return { type: "step", values };
	}

	// Range: 1-5
	if (token.includes("-")) {
		const [loStr, hiStr] = token.split("-");
		const lo = Number.parseInt(loStr, 10);
		const hi = Number.parseInt(hiStr, 10);
		if (Number.isNaN(lo) || Number.isNaN(hi)) {
			throw new Error(`Invalid range "${token}" in ${fieldName} field`);
		}
		validateRange(lo, hi, min, max, fieldName);
		return { type: "range", values: expandRange(lo, hi) };
	}

	// Single value
	const val = Number.parseInt(token, 10);
	if (Number.isNaN(val)) {
		throw new Error(`Invalid value "${token}" in ${fieldName} field`);
	}
	if (val < min || val > max) {
		throw new Error(
			`Value ${val} out of range (${min}-${max}) in ${fieldName} field`,
		);
	}
	return { type: "value", values: [val] };
}

function validateRange(
	lo: number,
	hi: number,
	min: number,
	max: number,
	fieldName: string,
) {
	if (lo < min || lo > max || hi < min || hi > max) {
		throw new Error(
			`Range ${lo}-${hi} out of bounds (${min}-${max}) in ${fieldName} field`,
		);
	}
	if (lo > hi) {
		throw new Error(
			`Range start ${lo} is greater than end ${hi} in ${fieldName} field`,
		);
	}
}

function expandRange(lo: number, hi: number): number[] {
	const result: number[] = [];
	for (let i = lo; i <= hi; i++) {
		result.push(i);
	}
	return result;
}

function fieldValues(field: CronField, min: number, max: number): number[] {
	if (field.type === "any") {
		return expandRange(min, max);
	}
	return field.values;
}

export function parseCronExpression(expr: string): CronParsed {
	const trimmed = expr.trim();
	const parts = trimmed.split(/\s+/);
	if (parts.length !== 5) {
		throw new Error(
			`Expected 5 fields (minute hour day-of-month month day-of-week), got ${parts.length}`,
		);
	}

	return {
		minute: parseField(parts[0], ...FIELD_RANGES.minute, "minute"),
		hour: parseField(parts[1], ...FIELD_RANGES.hour, "hour"),
		dayOfMonth: parseField(parts[2], ...FIELD_RANGES.dayOfMonth, "dayOfMonth"),
		month: parseField(parts[3], ...FIELD_RANGES.month, "month"),
		dayOfWeek: parseField(parts[4], ...FIELD_RANGES.dayOfWeek, "dayOfWeek"),
	};
}

export function validateCronExpression(expr: string): CronValidationResult {
	try {
		parseCronExpression(expr);
		return { valid: true };
	} catch (err) {
		return {
			valid: false,
			error: err instanceof Error ? err.message : "Invalid cron expression",
		};
	}
}

export function describeCron(parsed: CronParsed): string {
	const parts: string[] = [];

	// Minute description
	const minDesc = describeMinute(parsed.minute);
	// Hour description
	const hourDesc = describeHour(parsed.hour);
	// Day-of-month description
	const domDesc = describeDayOfMonth(parsed.dayOfMonth);
	// Month description
	const monthDesc = describeMonth(parsed.month);
	// Day-of-week description
	const dowDesc = describeDayOfWeek(parsed.dayOfWeek);

	// Build sentence
	if (
		parsed.minute.type === "any" &&
		parsed.hour.type === "any" &&
		parsed.dayOfMonth.type === "any" &&
		parsed.month.type === "any" &&
		parsed.dayOfWeek.type === "any"
	) {
		return "Every minute";
	}

	// Step in minutes (e.g. "every 15 minutes")
	if (parsed.minute.type === "step" && parsed.hour.type === "any") {
		parts.push(minDesc);
	} else if (parsed.minute.type === "any" && parsed.hour.type !== "any") {
		parts.push(`Every minute ${hourDesc}`);
	} else if (parsed.minute.type !== "any" && parsed.hour.type !== "any") {
		parts.push(`At ${minDesc} ${hourDesc}`);
	} else if (parsed.minute.type !== "any") {
		parts.push(`At ${minDesc}`);
	}

	if (domDesc) parts.push(domDesc);
	if (monthDesc) parts.push(monthDesc);
	if (dowDesc) parts.push(dowDesc);

	return parts.join(", ") || "Every minute";
}

function describeMinute(field: CronField): string {
	if (field.type === "any") return "every minute";
	if (field.type === "step") {
		const step =
			field.values.length > 1 ? field.values[1] - field.values[0] : 1;
		return `every ${step} minutes`;
	}
	if (field.type === "value") return `minute ${field.values[0]}`;
	const vals = field.values.map((v) => String(v).padStart(2, "0"));
	return `minutes ${vals.join(", ")}`;
}

function describeHour(field: CronField): string {
	if (field.type === "any") return "";
	if (field.type === "step") {
		const step =
			field.values.length > 1 ? field.values[1] - field.values[0] : 1;
		return `of every ${step} hours`;
	}
	if (field.type === "value") {
		return `at ${formatHour(field.values[0])}`;
	}
	if (field.type === "range") {
		return `between ${formatHour(field.values[0])} and ${formatHour(field.values[field.values.length - 1])}`;
	}
	const hours = field.values.map(formatHour);
	return `at ${hours.join(", ")}`;
}

function formatHour(h: number): string {
	if (h === 0) return "12:00 AM";
	if (h === 12) return "12:00 PM";
	if (h < 12) return `${h}:00 AM`;
	return `${h - 12}:00 PM`;
}

function describeDayOfMonth(field: CronField): string {
	if (field.type === "any") return "";
	if (field.type === "value") return `on day ${field.values[0]} of the month`;
	if (field.type === "range")
		return `on days ${field.values[0]}-${field.values[field.values.length - 1]} of the month`;
	if (field.type === "list")
		return `on days ${field.values.join(", ")} of the month`;
	return "";
}

function describeMonth(field: CronField): string {
	if (field.type === "any") return "";
	const names = field.values.map((v) => MONTH_NAMES[v] || String(v));
	if (field.type === "value") return `in ${names[0]}`;
	return `in ${names.join(", ")}`;
}

function describeDayOfWeek(field: CronField): string {
	if (field.type === "any") return "";
	const names = field.values.map((v) => DAY_NAMES[v] || String(v));
	if (field.type === "value") return `on ${names[0]}`;
	if (field.type === "range" && field.values.length === 5) {
		if (field.values[0] === 1 && field.values[field.values.length - 1] === 5) {
			return "on weekdays";
		}
	}
	return `on ${names.join(", ")}`;
}

export function getNextRuns(
	parsed: CronParsed,
	count: number,
	from?: Date,
): Date[] {
	const results: Date[] = [];
	const maxIterations = 525960; // ~1 year of minutes
	const start = from ? new Date(from.getTime()) : new Date();

	// Start from the next minute
	start.setSeconds(0, 0);
	start.setMinutes(start.getMinutes() + 1);

	const minutes = fieldValues(parsed.minute, ...FIELD_RANGES.minute);
	const hours = fieldValues(parsed.hour, ...FIELD_RANGES.hour);
	const daysOfMonth = fieldValues(
		parsed.dayOfMonth,
		...FIELD_RANGES.dayOfMonth,
	);
	const months = fieldValues(parsed.month, ...FIELD_RANGES.month);
	const daysOfWeek = fieldValues(parsed.dayOfWeek, ...FIELD_RANGES.dayOfWeek);

	const minuteSet = new Set(minutes);
	const hourSet = new Set(hours);
	const domSet = new Set(daysOfMonth);
	const monthSet = new Set(months);
	const dowSet = new Set(daysOfWeek);

	const current = new Date(start.getTime());
	let iterations = 0;

	while (results.length < count && iterations < maxIterations) {
		iterations++;

		const m = current.getMinutes();
		const h = current.getHours();
		const dom = current.getDate();
		// getMonth() is 0-based, cron months are 1-based
		const mon = current.getMonth() + 1;
		const dow = current.getDay();

		if (
			minuteSet.has(m) &&
			hourSet.has(h) &&
			domSet.has(dom) &&
			monthSet.has(mon) &&
			dowSet.has(dow)
		) {
			results.push(new Date(current.getTime()));
		}

		// Advance by 1 minute
		current.setMinutes(current.getMinutes() + 1);
	}

	return results;
}
