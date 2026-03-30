/**
 * Line-level text diff using Longest Common Subsequence (LCS).
 * Zero dependencies — pure algorithmic implementation.
 */

export type DiffLineType = "equal" | "added" | "removed";

export interface DiffLine {
	type: DiffLineType;
	content: string;
	leftLineNum?: number;
	rightLineNum?: number;
}

export interface DiffResult {
	lines: DiffLine[];
	stats: { added: number; removed: number; unchanged: number };
	identical: boolean;
}

/** Max input size: 10 MB of raw text */
export const MAX_TEXT_SIZE = 10 * 1024 * 1024;

/** Warn threshold: diffs above this line count may be slow */
export const LARGE_INPUT_THRESHOLD = 10_000;

/**
 * Compute a line-level diff between two strings using LCS.
 *
 * Splits both inputs by newline, builds an LCS table, then
 * backtracks to produce a sequence of equal/added/removed lines.
 */
export function computeDiff(left: string, right: string): DiffResult {
	const leftLines = left.split("\n");
	const rightLines = right.split("\n");

	const n = leftLines.length;
	const m = rightLines.length;

	// Build LCS table — dp[i][j] = length of LCS of
	// leftLines[0..i-1] and rightLines[0..j-1]
	const dp: number[][] = Array.from({ length: n + 1 }, () =>
		new Array(m + 1).fill(0),
	);

	for (let i = 1; i <= n; i++) {
		for (let j = 1; j <= m; j++) {
			if (leftLines[i - 1] === rightLines[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Backtrack to produce diff
	const lines: DiffLine[] = [];
	let i = n;
	let j = m;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
			lines.push({
				type: "equal",
				content: leftLines[i - 1],
				leftLineNum: i,
				rightLineNum: j,
			});
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			lines.push({
				type: "added",
				content: rightLines[j - 1],
				rightLineNum: j,
			});
			j--;
		} else {
			lines.push({
				type: "removed",
				content: leftLines[i - 1],
				leftLineNum: i,
			});
			i--;
		}
	}

	lines.reverse();

	// Compute stats
	let added = 0;
	let removed = 0;
	let unchanged = 0;

	for (const line of lines) {
		if (line.type === "added") added++;
		else if (line.type === "removed") removed++;
		else unchanged++;
	}

	return {
		lines,
		stats: { added, removed, unchanged },
		identical: added === 0 && removed === 0,
	};
}
