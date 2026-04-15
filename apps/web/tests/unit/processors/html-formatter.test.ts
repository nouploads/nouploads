import { describe, expect, it } from "vitest";
import {
	computeHtmlStats,
	formatHtml,
	INDENT_SIZE_OPTIONS,
	MAX_HTML_SIZE,
	validateHtml,
	WRAP_OPTIONS,
} from "~/features/developer-tools/processors/html-formatter";

describe("formatHtml", () => {
	it("should beautify a collapsed HTML document", async () => {
		const input =
			"<html><head><title>T</title></head><body><p>Hi</p></body></html>";
		const result = await formatHtml(input);
		expect(result).toContain("\n");
		expect(result).toContain("<body>");
		expect(result).toContain("<p>Hi</p>");
	});

	it("should respect indentSize", async () => {
		const input = "<div><p>Hi</p></div>";
		const result = await formatHtml(input, { indentSize: 4 });
		expect(result).toMatch(/\n {4}<p>/);
	});

	it("should use tab indent when indentChar is tab", async () => {
		const input = "<div><p>Hi</p></div>";
		const result = await formatHtml(input, {
			indentChar: "tab",
			indentSize: 1,
		});
		expect(result).toMatch(/\n\t<p>/);
	});

	it("should respect wrapLineLength for long lines", async () => {
		const longAttrs = Array.from(
			{ length: 20 },
			(_, i) => `data-attr-${i}="value-${i}"`,
		).join(" ");
		const input = `<div ${longAttrs}>Hi</div>`;
		const result = await formatHtml(input, { wrapLineLength: 40 });
		const maxLineLength = Math.max(
			...result.split("\n").map((line) => line.length),
		);
		expect(maxLineLength).toBeLessThan(longAttrs.length);
	});

	it("should preserve the DOCTYPE preamble", async () => {
		const input = "<!DOCTYPE html><html><body><p>Hi</p></body></html>";
		const result = await formatHtml(input);
		expect(result).toMatch(/^<!DOCTYPE html>/i);
	});

	it("should end output with a newline", async () => {
		const result = await formatHtml("<p>Hi</p>");
		expect(result.endsWith("\n")).toBe(true);
	});

	it("should handle HTML fragments", async () => {
		const result = await formatHtml(
			'<ul><li>a</li><li>b</li><li class="active">c</li></ul>',
		);
		expect(result).toContain("<ul>");
		expect(result).toContain('class="active"');
	});

	it("should preserve attribute quoting", async () => {
		const result = await formatHtml(
			'<a href="https://example.com" target="_blank">Link</a>',
		);
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('target="_blank"');
	});
});

describe("validateHtml", () => {
	it("should return valid for a well-formed fragment", () => {
		const result = validateHtml("<div><p>Hi</p></div>");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should return valid for a complete document", () => {
		const result = validateHtml("<!DOCTYPE html><html><body></body></html>");
		expect(result.valid).toBe(true);
	});

	it("should return invalid for an empty string", () => {
		const result = validateHtml("");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Empty input");
	});

	it("should return invalid for an unterminated tag", () => {
		const result = validateHtml("<div><p>Hi</p><span");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("Unterminated tag");
	});

	it("should return invalid for an unterminated comment", () => {
		const result = validateHtml("<div><!-- comment <p>Hi</p></div>");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("comment");
	});

	it("should accept comments that are properly closed", () => {
		const result = validateHtml("<div><!-- comment --><p>Hi</p></div>");
		expect(result.valid).toBe(true);
	});

	it("should accept attributes with angle brackets inside strings", () => {
		const result = validateHtml('<div data-expr="a < b && b > 0">Hi</div>');
		expect(result.valid).toBe(true);
	});
});

describe("computeHtmlStats", () => {
	it("should count lines in multi-line output", () => {
		const stats = computeHtmlStats("<div>\n  <p>Hi</p>\n</div>");
		expect(stats.lines).toBe(3);
	});

	it("should return 0 lines for empty input", () => {
		const stats = computeHtmlStats("");
		expect(stats.lines).toBe(0);
	});

	it("should report byte size", () => {
		const stats = computeHtmlStats("<p>Hi</p>");
		expect(stats.sizeBytes).toBe(9);
	});
});

describe("INDENT_SIZE_OPTIONS", () => {
	it("should include 2-space, 4-space, and tab", () => {
		const values = INDENT_SIZE_OPTIONS.map((o) => o.value);
		expect(values).toContain("2");
		expect(values).toContain("4");
		expect(values).toContain("tab");
	});
});

describe("WRAP_OPTIONS", () => {
	it("should include at least a no-wrap option", () => {
		const values = WRAP_OPTIONS.map((o) => o.value);
		expect(values).toContain("0");
	});
});

describe("MAX_HTML_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_HTML_SIZE).toBe(10 * 1024 * 1024);
	});
});
