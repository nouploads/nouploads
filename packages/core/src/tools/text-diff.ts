/**
 * Line-level text diff using Longest Common Subsequence (LCS). Single
 * source of truth for web and CLI. Zero dependencies. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

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

/** Separator between left and right text for CLI execute() input. */
const CLI_SEPARATOR = "\n---SPLIT---\n";

export function computeDiff(left: string, right: string): DiffResult {
	const leftLines = left.split("\n");
	const rightLines = right.split("\n");
	const n = leftLines.length;
	const m = rightLines.length;

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

const tool: ToolDefinition = {
	id: "text-diff",
	name: "Text Diff",
	category: "developer",
	description: "Compare two blocks of text with line-level diff.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [],
	execute: async (input, _options, context) => {
		const text = new TextDecoder().decode(input);
		context.onProgress?.(10);

		const separatorIndex = text.indexOf(CLI_SEPARATOR);
		if (separatorIndex === -1) {
			throw new Error(
				`Input must contain two texts separated by "${CLI_SEPARATOR.trim()}"`,
			);
		}

		const left = text.slice(0, separatorIndex);
		const right = text.slice(separatorIndex + CLI_SEPARATOR.length);
		const result = computeDiff(left, right);
		context.onProgress?.(100);

		return {
			output: new TextEncoder().encode(JSON.stringify(result, null, 2)),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
