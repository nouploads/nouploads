import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "cron-parser",
	name: "CRON Expression Parser",
	category: "developer",
	description:
		"Parse cron expressions into human-readable schedules with next run times.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "count",
			type: "number",
			description: "Number of next run times to calculate",
			default: 10,
			min: 1,
			max: 50,
		},
	],
	capabilities: ["browser"],
	execute: async (input, options, _context) => {
		const expr = new TextDecoder().decode(input).trim();
		if (!expr) {
			throw new Error("Empty cron expression");
		}

		const parsed = parseCronFields(expr);
		const description = buildDescription(parsed);
		const count = Math.min(Math.max(1, (options.count as number) || 10), 50);
		const nextRuns = computeNextRuns(parsed, count);

		const result = {
			expression: expr,
			description,
			nextRuns: nextRuns.map((d) => d.toISOString()),
		};

		const text = JSON.stringify(result, null, 2);
		const output = new TextEncoder().encode(text);

		return {
			output,
			extension: ".json",
			mimeType: "application/json",
			metadata: { description, runCount: nextRuns.length },
		};
	},
};

// ── Minimal inline parser (keeps core dependency-free) ──

interface ParsedFields {
	minute: number[];
	hour: number[];
	dayOfMonth: number[];
	month: number[];
	dayOfWeek: number[];
}

const RANGES: Record<string, [number, number]> = {
	minute: [0, 59],
	hour: [0, 23],
	dayOfMonth: [1, 31],
	month: [1, 12],
	dayOfWeek: [0, 6],
};

function expand(token: string, min: number, max: number): number[] {
	if (token === "*") {
		const r: number[] = [];
		for (let i = min; i <= max; i++) r.push(i);
		return r;
	}
	if (token.includes(",")) {
		return token.split(",").flatMap((p) => expand(p.trim(), min, max));
	}
	if (token.includes("/")) {
		const [rangeStr, stepStr] = token.split("/");
		const step = Number.parseInt(stepStr, 10);
		let lo = min;
		let hi = max;
		if (rangeStr !== "*") {
			if (rangeStr.includes("-")) {
				[lo, hi] = rangeStr.split("-").map(Number);
			} else {
				lo = Number.parseInt(rangeStr, 10);
			}
		}
		const r: number[] = [];
		for (let i = lo; i <= hi; i += step) r.push(i);
		return r;
	}
	if (token.includes("-")) {
		const [lo, hi] = token.split("-").map(Number);
		const r: number[] = [];
		for (let i = lo; i <= hi; i++) r.push(i);
		return r;
	}
	return [Number.parseInt(token, 10)];
}

function parseCronFields(expr: string): ParsedFields {
	const parts = expr.split(/\s+/);
	if (parts.length !== 5)
		throw new Error(`Expected 5 fields, got ${parts.length}`);
	return {
		minute: expand(parts[0], ...RANGES.minute),
		hour: expand(parts[1], ...RANGES.hour),
		dayOfMonth: expand(parts[2], ...RANGES.dayOfMonth),
		month: expand(parts[3], ...RANGES.month),
		dayOfWeek: expand(parts[4], ...RANGES.dayOfWeek),
	};
}

function buildDescription(p: ParsedFields): string {
	const parts: string[] = [];
	if (p.minute.length === 60 && p.hour.length === 24) {
		parts.push("Every minute");
	} else if (p.minute.length < 60 && p.minute.length > 1) {
		const step = p.minute[1] - p.minute[0];
		const isStep = p.minute.every((v, i) => v === p.minute[0] + i * step);
		if (isStep && p.minute[0] === 0) {
			parts.push(`Every ${step} minutes`);
		} else {
			parts.push(`At minutes ${p.minute.join(", ")}`);
		}
	} else if (p.minute.length === 1) {
		parts.push(`At minute ${p.minute[0]}`);
	}

	if (p.hour.length < 24 && p.hour.length === 1) {
		const h = p.hour[0];
		const ampm =
			h === 0
				? "12:00 AM"
				: h === 12
					? "12:00 PM"
					: h < 12
						? `${h}:00 AM`
						: `${h - 12}:00 PM`;
		parts.push(`at ${ampm}`);
	}

	if (p.dayOfWeek.length < 7) {
		const days = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		];
		if (
			p.dayOfWeek.length === 5 &&
			p.dayOfWeek[0] === 1 &&
			p.dayOfWeek[4] === 5
		) {
			parts.push("on weekdays");
		} else {
			parts.push(`on ${p.dayOfWeek.map((d) => days[d]).join(", ")}`);
		}
	}

	if (p.month.length < 12) {
		const months = [
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
		parts.push(`in ${p.month.map((m) => months[m]).join(", ")}`);
	}

	if (p.dayOfMonth.length < 31) {
		parts.push(`on day ${p.dayOfMonth.join(", ")} of the month`);
	}

	return parts.join(" ") || "Every minute";
}

function computeNextRuns(p: ParsedFields, count: number): Date[] {
	const results: Date[] = [];
	const now = new Date();
	now.setSeconds(0, 0);
	now.setMinutes(now.getMinutes() + 1);

	const minuteSet = new Set(p.minute);
	const hourSet = new Set(p.hour);
	const domSet = new Set(p.dayOfMonth);
	const monthSet = new Set(p.month);
	const dowSet = new Set(p.dayOfWeek);

	const current = new Date(now.getTime());
	let iterations = 0;
	const maxIter = 525960;

	while (results.length < count && iterations < maxIter) {
		iterations++;
		if (
			minuteSet.has(current.getMinutes()) &&
			hourSet.has(current.getHours()) &&
			domSet.has(current.getDate()) &&
			monthSet.has(current.getMonth() + 1) &&
			dowSet.has(current.getDay())
		) {
			results.push(new Date(current.getTime()));
		}
		current.setMinutes(current.getMinutes() + 1);
	}

	return results;
}

registerTool(tool);
export default tool;
