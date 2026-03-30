/**
 * Markdown rendering and statistics.
 * Uses the `marked` library for GitHub Flavored Markdown parsing.
 */

import { marked } from "marked";

export interface MarkdownRenderOptions {
	/** Enable GitHub Flavored Markdown (tables, strikethrough, task lists) */
	gfm?: boolean;
}

/**
 * Render a Markdown string to HTML.
 * Returns a sanitised HTML string using `marked` with GFM support.
 */
export function renderMarkdown(
	input: string,
	options?: MarkdownRenderOptions,
): string {
	const gfm = options?.gfm ?? true;

	return marked(input, {
		async: false,
		gfm,
		breaks: true,
	}) as string;
}

/** Count the number of words in a plain-text string. */
export function getWordCount(input: string): number {
	const trimmed = input.trim();
	if (trimmed.length === 0) return 0;
	return trimmed.split(/\s+/).length;
}

/** Count the number of characters in a string. */
export function getCharCount(input: string): number {
	return input.length;
}

/** Count the number of lines in a string. */
export function getLineCount(input: string): number {
	if (input.length === 0) return 0;
	return input.split("\n").length;
}

/** Max input size: 5 MB of raw Markdown text */
export const MAX_MARKDOWN_SIZE = 5 * 1024 * 1024;
