/**
 * Unix timestamp ↔ human-readable date conversion.
 * Uses only built-in Date and Intl.DateTimeFormat — zero dependencies.
 */

export interface TimestampResult {
	/** Unix timestamp in seconds */
	unix: number;
	/** Unix timestamp in milliseconds */
	unixMs: number;
	/** ISO 8601 format */
	iso8601: string;
	/** RFC 2822 format */
	rfc2822: string;
	/** UTC string */
	utc: string;
	/** Locale-aware string */
	local: string;
	/** Relative time ("3 hours ago", "in 2 days") */
	relative: string;
	/** Date part YYYY-MM-DD */
	date: string;
	/** Time part HH:MM:SS */
	time: string;
}

/**
 * Heuristic: values above 1e12 are likely milliseconds.
 * Unix seconds for year 2001 = ~1e9, for year 33658 = ~1e12.
 */
export function isMilliseconds(value: number): boolean {
	return Math.abs(value) > 1e12;
}

/**
 * Compute a human-readable relative time string from a Date.
 */
export function toRelative(date: Date): string {
	const now = Date.now();
	const diffMs = date.getTime() - now;
	const absDiffMs = Math.abs(diffMs);
	const isPast = diffMs < 0;

	const seconds = Math.floor(absDiffMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	let label: string;
	if (seconds < 5) {
		return "just now";
	}
	if (seconds < 60) {
		label = `${seconds} second${seconds !== 1 ? "s" : ""}`;
	} else if (minutes < 60) {
		label = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
	} else if (hours < 24) {
		label = `${hours} hour${hours !== 1 ? "s" : ""}`;
	} else if (days < 30) {
		label = `${days} day${days !== 1 ? "s" : ""}`;
	} else if (months < 12) {
		label = `${months} month${months !== 1 ? "s" : ""}`;
	} else {
		label = `${years} year${years !== 1 ? "s" : ""}`;
	}

	return isPast ? `${label} ago` : `in ${label}`;
}

function buildResult(date: Date): TimestampResult {
	const ms = date.getTime();
	const sec = Math.floor(ms / 1000);

	// YYYY-MM-DD in local timezone
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	// HH:MM:SS in local timezone
	const hh = String(date.getHours()).padStart(2, "0");
	const mm = String(date.getMinutes()).padStart(2, "0");
	const ss = String(date.getSeconds()).padStart(2, "0");

	return {
		unix: sec,
		unixMs: ms,
		iso8601: date.toISOString(),
		rfc2822: date.toUTCString(),
		utc: date.toUTCString(),
		local: date.toLocaleString(),
		relative: toRelative(date),
		date: `${year}-${month}-${day}`,
		time: `${hh}:${mm}:${ss}`,
	};
}

/**
 * Convert a numeric timestamp to all date formats.
 * Auto-detects seconds vs milliseconds.
 */
export function fromTimestamp(value: number): TimestampResult {
	if (!Number.isFinite(value)) {
		throw new Error("Invalid timestamp: value must be a finite number");
	}
	const ms = isMilliseconds(value) ? value : value * 1000;
	const date = new Date(ms);
	if (Number.isNaN(date.getTime())) {
		throw new Error("Invalid timestamp: could not create a valid date");
	}
	return buildResult(date);
}

/**
 * Parse a date string and return all timestamp formats.
 * Accepts ISO 8601, RFC 2822, and common date formats.
 */
export function fromDate(dateStr: string): TimestampResult {
	const trimmed = dateStr.trim();
	if (!trimmed) {
		throw new Error("Empty date string");
	}

	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date string: "${trimmed}"`);
	}
	return buildResult(date);
}

/**
 * Get the current time as a TimestampResult.
 */
export function getNow(): TimestampResult {
	return buildResult(new Date());
}
