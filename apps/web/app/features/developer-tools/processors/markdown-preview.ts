/**
 * Markdown rendering — web adapter. Single source of truth lives in
 * @nouploads/core/tools/markdown-preview (uses marked under the hood).
 */
export {
	getCharCount,
	getLineCount,
	getWordCount,
	MAX_MARKDOWN_SIZE,
	type MarkdownRenderOptions,
	renderMarkdown,
} from "@nouploads/core/tools/markdown-preview";
