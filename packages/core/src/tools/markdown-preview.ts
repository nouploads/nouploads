/**
 * Markdown rendering. Single source of truth for web and CLI. Uses
 * `marked` with GitHub Flavored Markdown support. Sync (marked supports
 * sync mode via `async: false`).
 */

import { marked } from "marked";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export interface MarkdownRenderOptions {
	/** Enable GitHub Flavored Markdown (tables, strikethrough, task lists) */
	gfm?: boolean;
}

/**
 * Render a Markdown string to HTML synchronously. Uses `marked` with
 * `async: false` so the return is a plain string, not a Promise.
 */
export function renderMarkdown(
	input: string,
	options?: MarkdownRenderOptions,
): string {
	const gfm = options?.gfm ?? true;
	return marked(input, { async: false, gfm, breaks: true }) as string;
}

export function getWordCount(input: string): number {
	const trimmed = input.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).length;
}

export function getCharCount(input: string): number {
	return input.length;
}

export function getLineCount(input: string): number {
	if (input.length === 0) return 0;
	return input.split("\n").length;
}

/** Max input size: 5 MB of raw Markdown text */
export const MAX_MARKDOWN_SIZE = 5 * 1024 * 1024;

const tool: ToolDefinition = {
	id: "markdown-preview",
	name: "Markdown Preview",
	category: "developer",
	description: "Live Markdown editor with real-time rendered preview.",
	inputMimeTypes: ["text/markdown", "text/plain"],
	inputExtensions: [".md", ".txt", ".markdown"],
	options: [
		{
			name: "gfm",
			type: "boolean",
			description: "Enable GitHub Flavored Markdown",
			default: true,
		},
	],
	execute: async (input, options, context) => {
		const text = new TextDecoder().decode(input);
		const gfm = options.gfm !== false;
		context.onProgress?.(10);
		const html = renderMarkdown(text, { gfm });
		context.onProgress?.(100);
		return {
			output: new TextEncoder().encode(html),
			extension: ".html",
			mimeType: "text/html",
			metadata: {
				words: getWordCount(text),
				chars: getCharCount(text),
				lines: getLineCount(text),
			},
		};
	},
};

registerTool(tool);
export default tool;
