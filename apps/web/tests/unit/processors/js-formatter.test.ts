import { describe, expect, it } from "vitest";
import {
	BRACE_STYLE_OPTIONS,
	computeJsStats,
	formatJs,
	INDENT_SIZE_OPTIONS,
	MAX_JS_SIZE,
	validateJs,
} from "~/features/developer-tools/processors/js-formatter";

describe("formatJs", () => {
	it("should beautify a single-line function", async () => {
		const input = "function greet(name){return 'hello '+name}";
		const result = await formatJs(input);
		expect(result).toContain("function greet(name)");
		expect(result).toContain("return");
		expect(result).toContain("\n");
	});

	it("should respect indentSize", async () => {
		const input = "if(x){doIt()}";
		const result = await formatJs(input, { indentSize: 4 });
		expect(result).toMatch(/\n {4}doIt/);
	});

	it("should use tab indent when indentChar is tab", async () => {
		const input = "if(x){doIt()}";
		const result = await formatJs(input, { indentChar: "tab", indentSize: 1 });
		expect(result).toMatch(/\n\tdoIt/);
	});

	it("should place opening brace on next line when braceStyle is expand", async () => {
		const input = "function f(){return 1}";
		const result = await formatJs(input, { braceStyle: "expand" });
		expect(result).toMatch(/function f\(\)\s*\n\s*\{/);
	});

	it("should keep opening brace on same line by default (collapse)", async () => {
		const input = "function f(){return 1}";
		const result = await formatJs(input, { braceStyle: "collapse" });
		expect(result).toMatch(/function f\(\) \{/);
	});

	it("should end output with a newline", async () => {
		const result = await formatJs("const x = 1");
		expect(result.endsWith("\n")).toBe(true);
	});

	it("should handle template literals", async () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: testing template literal string form
		const expr = "hello ${n}";
		const input = `const g=(n)=>\`${expr}\``;
		const result = await formatJs(input);
		expect(result).toContain(`\`${expr}\``);
	});

	it("should preserve string literals verbatim", async () => {
		const input = "const s='a   b   c'";
		const result = await formatJs(input);
		expect(result).toContain("'a   b   c'");
	});

	it("should format object literals across lines", async () => {
		const input = "const o={a:1,b:2,c:3}";
		const result = await formatJs(input);
		// Default beautify breaks object literals across lines with indented keys
		expect(result).toContain("a: 1");
		expect(result).toContain("b: 2");
	});
});

describe("validateJs", () => {
	it("should return valid for a well-formed statement", () => {
		const result = validateJs("const x = { a: 1 };");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should return valid for a function expression", () => {
		const result = validateJs("function f(a, b) { return a + b; }");
		expect(result.valid).toBe(true);
	});

	it("should return invalid for an empty string", () => {
		const result = validateJs("");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Empty input");
	});

	it("should return invalid for an unbalanced closing brace", () => {
		const result = validateJs("function f() { return 1; }}");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("closing brace");
	});

	it("should return invalid for an unbalanced opening brace", () => {
		const result = validateJs("function f() { return 1;");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("opening brace");
	});

	it("should return invalid for an unbalanced closing paren", () => {
		const result = validateJs("const x = foo());");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("closing parenthesis");
	});

	it("should return invalid for an unbalanced closing bracket", () => {
		const result = validateJs("const a = [1, 2]];");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("closing bracket");
	});

	it("should return invalid for an unterminated string", () => {
		const result = validateJs("const s = 'hello");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("string");
	});

	it("should return invalid for an unterminated block comment", () => {
		const result = validateJs("const x = 1; /* unterminated");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("block comment");
	});

	it("should ignore braces inside strings", () => {
		const result = validateJs('const s = "{{{"; const n = 1;');
		expect(result.valid).toBe(true);
	});

	it("should ignore braces inside line comments", () => {
		const result = validateJs("const n = 1; // { unclosed");
		expect(result.valid).toBe(true);
	});

	it("should ignore braces inside block comments", () => {
		const result = validateJs("const n = 1; /* { unclosed */");
		expect(result.valid).toBe(true);
	});

	it("should handle escaped quotes in strings", () => {
		const result = validateJs('const s = "hello \\"world\\""');
		expect(result.valid).toBe(true);
	});

	it("should handle template literals", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: testing template literal string form
		const expr = "hello ${name}";
		const result = validateJs(`const s = \`${expr}\``);
		expect(result.valid).toBe(true);
	});
});

describe("computeJsStats", () => {
	it("should count lines in multi-line output", () => {
		const stats = computeJsStats("const x = 1;\nconst y = 2;\n");
		expect(stats.lines).toBe(3);
	});

	it("should return 0 lines for empty input", () => {
		const stats = computeJsStats("");
		expect(stats.lines).toBe(0);
	});

	it("should report byte size", () => {
		const stats = computeJsStats("const x = 1");
		expect(stats.sizeBytes).toBe(11);
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

describe("BRACE_STYLE_OPTIONS", () => {
	it("should include collapse, expand, and end-expand", () => {
		const values = BRACE_STYLE_OPTIONS.map((o) => o.value);
		expect(values).toContain("collapse");
		expect(values).toContain("expand");
		expect(values).toContain("end-expand");
	});
});

describe("MAX_JS_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_JS_SIZE).toBe(10 * 1024 * 1024);
	});
});
