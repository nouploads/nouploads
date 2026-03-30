/**
 * Regex testing, match extraction, and validation.
 * Uses only built-in RegExp and String.matchAll() — zero dependencies.
 */

export interface RegexMatch {
	fullMatch: string;
	index: number;
	groups: string[];
	groupNames?: Record<string, string>;
}

export interface RegexResult {
	matches: RegexMatch[];
	matchCount: number;
	error: string | null;
}

export function testRegex(
	pattern: string,
	flags: string,
	testString: string,
): RegexResult {
	if (!pattern) {
		return { matches: [], matchCount: 0, error: null };
	}

	const validation = validateRegex(pattern, flags);
	if (!validation.valid) {
		return { matches: [], matchCount: 0, error: validation.error ?? null };
	}

	// Ensure 'g' flag is present for matchAll
	const effectiveFlags = flags.includes("g") ? flags : `${flags}g`;
	const regex = new RegExp(pattern, effectiveFlags);
	const matches: RegexMatch[] = [];

	for (const match of testString.matchAll(regex)) {
		matches.push({
			fullMatch: match[0],
			index: match.index ?? 0,
			groups: match.slice(1).map((g) => g ?? ""),
			groupNames: match.groups
				? Object.fromEntries(
						Object.entries(match.groups).map(([k, v]) => [k, v ?? ""]),
					)
				: undefined,
		});
	}

	return { matches, matchCount: matches.length, error: null };
}

export function validateRegex(
	pattern: string,
	flags: string,
): { valid: boolean; error?: string } {
	try {
		new RegExp(pattern, flags);
		return { valid: true };
	} catch (err) {
		const msg =
			err instanceof Error ? err.message : "Invalid regular expression";
		return { valid: false, error: msg };
	}
}

/** Max input size: 1 MB of test string text */
export const MAX_TEST_STRING_SIZE = 1 * 1024 * 1024;
