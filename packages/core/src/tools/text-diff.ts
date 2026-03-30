import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const SEPARATOR = "\n---SPLIT---\n";

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

		const separatorIndex = text.indexOf(SEPARATOR);
		if (separatorIndex === -1) {
			throw new Error(
				`Input must contain two texts separated by "${SEPARATOR.trim()}"`,
			);
		}

		const left = text.slice(0, separatorIndex);
		const right = text.slice(separatorIndex + SEPARATOR.length);

		// Inline a minimal LCS diff to avoid importing from the web package
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

		context.onProgress?.(60);

		const diffLines: Array<{
			type: "equal" | "added" | "removed";
			content: string;
		}> = [];
		let i = n;
		let j = m;

		while (i > 0 || j > 0) {
			if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
				diffLines.push({ type: "equal", content: leftLines[i - 1] });
				i--;
				j--;
			} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
				diffLines.push({ type: "added", content: rightLines[j - 1] });
				j--;
			} else {
				diffLines.push({
					type: "removed",
					content: leftLines[i - 1],
				});
				i--;
			}
		}

		diffLines.reverse();

		let added = 0;
		let removed = 0;
		let unchanged = 0;
		for (const line of diffLines) {
			if (line.type === "added") added++;
			else if (line.type === "removed") removed++;
			else unchanged++;
		}

		context.onProgress?.(100);

		const result = JSON.stringify(
			{
				lines: diffLines,
				stats: { added, removed, unchanged },
				identical: added === 0 && removed === 0,
			},
			null,
			2,
		);

		return {
			output: new TextEncoder().encode(result),
			extension: ".json",
			mimeType: "application/json",
		};
	},
};

registerTool(tool);
export default tool;
