import { describe, expect, it } from "vitest";
import {
	getCharCount,
	getLineCount,
	getWordCount,
	MAX_MARKDOWN_SIZE,
	renderMarkdown,
} from "~/features/developer-tools/processors/markdown-preview";

describe("renderMarkdown", () => {
	it("should render a heading", () => {
		const result = renderMarkdown("# Hello");
		expect(result).toContain("<h1");
		expect(result).toContain("Hello");
	});

	it("should render bold text", () => {
		const result = renderMarkdown("**bold**");
		expect(result).toContain("<strong>");
		expect(result).toContain("bold");
	});

	it("should render italic text", () => {
		const result = renderMarkdown("*italic*");
		expect(result).toContain("<em>");
		expect(result).toContain("italic");
	});

	it("should render strikethrough with GFM", () => {
		const result = renderMarkdown("~~deleted~~", { gfm: true });
		expect(result).toContain("<del>");
		expect(result).toContain("deleted");
	});

	it("should render a GFM table", () => {
		const md = `| A | B |
|---|---|
| 1 | 2 |`;
		const result = renderMarkdown(md, { gfm: true });
		expect(result).toContain("<table>");
		expect(result).toContain("<th>");
		expect(result).toContain("<td>");
	});

	it("should render a task list with GFM", () => {
		const md = `- [x] Done
- [ ] Todo`;
		const result = renderMarkdown(md, { gfm: true });
		// marked renders task list checkboxes as <input> elements
		expect(result).toContain("checked");
	});

	it("should render code blocks", () => {
		const md = "```js\nconsole.log('hi');\n```";
		const result = renderMarkdown(md);
		expect(result).toContain("<code");
		expect(result).toContain("console.log");
	});

	it("should render inline code", () => {
		const result = renderMarkdown("Use `const` keyword");
		expect(result).toContain("<code>");
		expect(result).toContain("const");
	});

	it("should render links", () => {
		const result = renderMarkdown("[NoUploads](https://nouploads.com)");
		expect(result).toContain("<a ");
		expect(result).toContain("https://nouploads.com");
	});

	it("should render unordered lists", () => {
		const md = `- Item 1
- Item 2
- Item 3`;
		const result = renderMarkdown(md);
		expect(result).toContain("<ul>");
		expect(result).toContain("<li>");
	});

	it("should render ordered lists", () => {
		const md = `1. First
2. Second
3. Third`;
		const result = renderMarkdown(md);
		expect(result).toContain("<ol>");
		expect(result).toContain("<li>");
	});

	it("should render blockquotes", () => {
		const result = renderMarkdown("> A quote");
		expect(result).toContain("<blockquote>");
	});

	it("should return empty/minimal HTML for empty input", () => {
		const result = renderMarkdown("");
		expect(result.trim()).toBe("");
	});

	it("should handle multiple headings", () => {
		const md = `# H1
## H2
### H3`;
		const result = renderMarkdown(md);
		expect(result).toContain("<h1");
		expect(result).toContain("<h2");
		expect(result).toContain("<h3");
	});

	it("should render horizontal rules", () => {
		const result = renderMarkdown("---");
		expect(result).toContain("<hr");
	});

	it("should support line breaks when breaks option is active", () => {
		const result = renderMarkdown("line1\nline2");
		expect(result).toContain("<br");
	});
});

describe("getWordCount", () => {
	it("should count words in a simple sentence", () => {
		expect(getWordCount("hello world foo")).toBe(3);
	});

	it("should return 0 for empty string", () => {
		expect(getWordCount("")).toBe(0);
	});

	it("should return 0 for whitespace-only string", () => {
		expect(getWordCount("   \n\t  ")).toBe(0);
	});

	it("should count single word", () => {
		expect(getWordCount("hello")).toBe(1);
	});

	it("should handle multiple spaces between words", () => {
		expect(getWordCount("one   two   three")).toBe(3);
	});

	it("should handle newlines as word separators", () => {
		expect(getWordCount("one\ntwo\nthree")).toBe(3);
	});
});

describe("getCharCount", () => {
	it("should count characters", () => {
		expect(getCharCount("abc")).toBe(3);
	});

	it("should return 0 for empty string", () => {
		expect(getCharCount("")).toBe(0);
	});

	it("should count spaces as characters", () => {
		expect(getCharCount("a b")).toBe(3);
	});

	it("should count newlines as characters", () => {
		expect(getCharCount("a\nb")).toBe(3);
	});
});

describe("getLineCount", () => {
	it("should count lines", () => {
		expect(getLineCount("line1\nline2\nline3")).toBe(3);
	});

	it("should return 0 for empty string", () => {
		expect(getLineCount("")).toBe(0);
	});

	it("should count single line", () => {
		expect(getLineCount("hello")).toBe(1);
	});

	it("should count trailing newline as extra line", () => {
		expect(getLineCount("line1\n")).toBe(2);
	});
});

describe("MAX_MARKDOWN_SIZE", () => {
	it("should be 5 MB", () => {
		expect(MAX_MARKDOWN_SIZE).toBe(5 * 1024 * 1024);
	});
});
