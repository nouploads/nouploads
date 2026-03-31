import { describe, expect, it } from "vitest";
import {
	beautifyCss,
	calculateSavings,
	MAX_CSS_SIZE,
	minifyCss,
} from "~/features/developer-tools/processors/css-formatter";

describe("minifyCss", () => {
	it("should strip comments and collapse whitespace", () => {
		const input = `body {
  color: red;
  /* comment */
  margin: 0;
}`;
		const result = minifyCss(input);
		expect(result).not.toContain("/*");
		expect(result).not.toContain("comment");
		expect(result).not.toContain("\n");
		expect(result).toContain("body{");
		expect(result).toContain("color:red");
	});

	it("should remove trailing semicolons before closing braces", () => {
		const input = "a { color: red; }";
		const result = minifyCss(input);
		expect(result).toBe("a{color:red}");
	});

	it("should handle multiple rules", () => {
		const input = `
h1 {
  font-size: 24px;
}
p {
  line-height: 1.5;
}`;
		const result = minifyCss(input);
		expect(result).toContain("h1{font-size:24px}");
		expect(result).toContain("p{line-height:1.5}");
	});

	it("should handle media queries", () => {
		const input = `@media (max-width: 768px) {
  .container {
    width: 100%;
  }
}`;
		const result = minifyCss(input);
		expect(result).toContain("@media");
		expect(result).not.toContain("\n");
	});

	it("should return empty string for empty input", () => {
		expect(minifyCss("")).toBe("");
		expect(minifyCss("   ")).toBe("");
	});
});

describe("beautifyCss", () => {
	it("should add proper indentation to minified CSS", () => {
		const input = "body{color:red;margin:0}";
		const result = beautifyCss(input);
		expect(result).toContain("\n");
		expect(result).toContain("  color: red;");
		// Last property before } has no trailing semicolon in minified input
		expect(result).toContain("  margin: 0");
	});

	it("should handle nested rules", () => {
		const input = "@media(max-width:768px){.box{display:block}}";
		const result = beautifyCss(input);
		expect(result).toContain("\n");
		// Should have nested indentation
		const lines = result.split("\n");
		expect(lines.length).toBeGreaterThan(2);
	});

	it("should handle multiple selectors", () => {
		const input = "h1{font-size:24px}p{line-height:1.5}";
		const result = beautifyCss(input);
		expect(result).toContain("h1 {");
		expect(result).toContain("p {");
	});

	it("should return empty string for empty input", () => {
		expect(beautifyCss("")).toBe("");
		expect(beautifyCss("   ")).toBe("");
	});

	it("should not crash on malformed CSS with extra braces", () => {
		expect(() => beautifyCss("{{{")).not.toThrow();
	});

	it("should not crash on malformed CSS with unbalanced braces", () => {
		expect(() => beautifyCss("a { color: red")).not.toThrow();
		expect(() => beautifyCss("}}}")).not.toThrow();
	});
});

describe("calculateSavings", () => {
	it("should calculate correct savings for minification", () => {
		const original = "body {\n  color: red;\n  margin: 0;\n}";
		const output = "body{color:red;margin:0}";
		const result = calculateSavings(original, output);
		expect(result.originalSize).toBeGreaterThan(result.outputSize);
		expect(result.savingsPercent).toBeGreaterThan(0);
	});

	it("should calculate negative savings when output is larger", () => {
		const original = "a{color:red}";
		const output = "a {\n  color: red;\n}";
		const result = calculateSavings(original, output);
		expect(result.savingsPercent).toBeLessThan(0);
	});

	it("should return 0% for identical strings", () => {
		const text = "a { color: red; }";
		const result = calculateSavings(text, text);
		expect(result.savingsPercent).toBe(0);
	});

	it("should handle empty strings", () => {
		const result = calculateSavings("", "");
		expect(result.originalSize).toBe(0);
		expect(result.outputSize).toBe(0);
		expect(result.savingsPercent).toBe(0);
	});
});

describe("MAX_CSS_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_CSS_SIZE).toBe(10 * 1024 * 1024);
	});
});
