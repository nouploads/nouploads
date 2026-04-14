import { describe, expect, it } from "vitest";
import {
	convertCase,
	splitWords,
	toCamelCase,
	toConstantCase,
	toDotCase,
	toKebabCase,
	toLowerCase,
	toPascalCase,
	toSentenceCase,
	toSnakeCase,
	toTitleCase,
	toUpperCase,
} from "~/features/developer-tools/processors/case-converter";

describe("splitWords", () => {
	it("should split on spaces", () => {
		expect(splitWords("hello world example")).toEqual([
			"hello",
			"world",
			"example",
		]);
	});

	it("should split on hyphens", () => {
		expect(splitWords("hello-world-example")).toEqual([
			"hello",
			"world",
			"example",
		]);
	});

	it("should split on underscores", () => {
		expect(splitWords("hello_world_example")).toEqual([
			"hello",
			"world",
			"example",
		]);
	});

	it("should split on dots", () => {
		expect(splitWords("hello.world.example")).toEqual([
			"hello",
			"world",
			"example",
		]);
	});

	it("should split on camelCase boundaries", () => {
		expect(splitWords("helloWorldExample")).toEqual([
			"hello",
			"World",
			"Example",
		]);
	});

	it("should split on PascalCase boundaries", () => {
		expect(splitWords("HelloWorldExample")).toEqual([
			"Hello",
			"World",
			"Example",
		]);
	});

	it("should handle uppercase acronyms", () => {
		expect(splitWords("parseHTTPResponse")).toEqual([
			"parse",
			"HTTP",
			"Response",
		]);
	});

	it("should handle empty string", () => {
		expect(splitWords("")).toEqual([]);
	});

	it("should handle single word", () => {
		expect(splitWords("hello")).toEqual(["hello"]);
	});

	it("should handle mixed delimiters", () => {
		expect(splitWords("hello_world-test case")).toEqual([
			"hello",
			"world",
			"test",
			"case",
		]);
	});

	it("should handle numbers", () => {
		expect(splitWords("version2update")).toEqual(["version2update"]);
	});
});

describe("toUpperCase", () => {
	it("should convert to UPPERCASE", () => {
		expect(toUpperCase("hello world example")).toBe("HELLO WORLD EXAMPLE");
	});
});

describe("toLowerCase", () => {
	it("should convert to lowercase", () => {
		expect(toLowerCase("Hello World EXAMPLE")).toBe("hello world example");
	});
});

describe("toTitleCase", () => {
	it("should capitalize first letter of each word", () => {
		expect(toTitleCase("hello world example")).toBe("Hello World Example");
	});

	it("should handle camelCase input", () => {
		expect(toTitleCase("helloWorldExample")).toBe("Hello World Example");
	});

	it("should handle snake_case input", () => {
		expect(toTitleCase("hello_world_example")).toBe("Hello World Example");
	});
});

describe("toSentenceCase", () => {
	it("should capitalize only first word", () => {
		expect(toSentenceCase("hello world example")).toBe("Hello world example");
	});

	it("should handle empty string", () => {
		expect(toSentenceCase("")).toBe("");
	});
});

describe("toCamelCase", () => {
	it("should convert space-separated words", () => {
		expect(toCamelCase("hello world example")).toBe("helloWorldExample");
	});

	it("should convert snake_case", () => {
		expect(toCamelCase("hello_world_example")).toBe("helloWorldExample");
	});

	it("should convert kebab-case", () => {
		expect(toCamelCase("hello-world-example")).toBe("helloWorldExample");
	});

	it("should convert PascalCase", () => {
		expect(toCamelCase("HelloWorldExample")).toBe("helloWorldExample");
	});

	it("should convert CONSTANT_CASE", () => {
		expect(toCamelCase("HELLO_WORLD_EXAMPLE")).toBe("helloWorldExample");
	});
});

describe("toPascalCase", () => {
	it("should convert space-separated words", () => {
		expect(toPascalCase("hello world example")).toBe("HelloWorldExample");
	});

	it("should convert camelCase", () => {
		expect(toPascalCase("helloWorldExample")).toBe("HelloWorldExample");
	});
});

describe("toSnakeCase", () => {
	it("should convert space-separated words", () => {
		expect(toSnakeCase("hello world example")).toBe("hello_world_example");
	});

	it("should convert camelCase", () => {
		expect(toSnakeCase("helloWorldExample")).toBe("hello_world_example");
	});

	it("should convert PascalCase", () => {
		expect(toSnakeCase("HelloWorldExample")).toBe("hello_world_example");
	});

	it("should convert kebab-case", () => {
		expect(toSnakeCase("hello-world-example")).toBe("hello_world_example");
	});
});

describe("toKebabCase", () => {
	it("should convert space-separated words", () => {
		expect(toKebabCase("hello world example")).toBe("hello-world-example");
	});

	it("should convert camelCase", () => {
		expect(toKebabCase("helloWorldExample")).toBe("hello-world-example");
	});
});

describe("toConstantCase", () => {
	it("should convert space-separated words", () => {
		expect(toConstantCase("hello world example")).toBe("HELLO_WORLD_EXAMPLE");
	});

	it("should convert camelCase", () => {
		expect(toConstantCase("helloWorldExample")).toBe("HELLO_WORLD_EXAMPLE");
	});
});

describe("toDotCase", () => {
	it("should convert space-separated words", () => {
		expect(toDotCase("hello world example")).toBe("hello.world.example");
	});

	it("should convert camelCase", () => {
		expect(toDotCase("helloWorldExample")).toBe("hello.world.example");
	});
});

describe("convertCase dispatcher", () => {
	it("should dispatch to the correct converter", () => {
		expect(convertCase("hello world", "upper")).toBe("HELLO WORLD");
		expect(convertCase("hello world", "camel")).toBe("helloWorld");
		expect(convertCase("hello world", "snake")).toBe("hello_world");
		expect(convertCase("hello world", "kebab")).toBe("hello-world");
		expect(convertCase("hello world", "pascal")).toBe("HelloWorld");
		expect(convertCase("hello world", "constant")).toBe("HELLO_WORLD");
		expect(convertCase("hello world", "dot")).toBe("hello.world");
		expect(convertCase("hello world", "title")).toBe("Hello World");
		expect(convertCase("hello world", "sentence")).toBe("Hello world");
		expect(convertCase("hello world", "lower")).toBe("hello world");
	});

	it("should throw on unknown case style", () => {
		expect(() => convertCase("test", "unknown")).toThrow(
			"Unknown case style: unknown",
		);
	});

	it("should handle empty string for all cases", () => {
		expect(convertCase("", "upper")).toBe("");
		expect(convertCase("", "lower")).toBe("");
		expect(convertCase("", "title")).toBe("");
		expect(convertCase("", "sentence")).toBe("");
		expect(convertCase("", "camel")).toBe("");
		expect(convertCase("", "pascal")).toBe("");
		expect(convertCase("", "snake")).toBe("");
		expect(convertCase("", "kebab")).toBe("");
		expect(convertCase("", "constant")).toBe("");
		expect(convertCase("", "dot")).toBe("");
	});
});

describe("splitWords edge cases", () => {
	it("should strip leading and trailing separators", () => {
		expect(splitWords("  hello world  ")).toEqual(["hello", "world"]);
		expect(splitWords("__hello__world__")).toEqual(["hello", "world"]);
		expect(splitWords("--hello--world--")).toEqual(["hello", "world"]);
	});

	it("should collapse runs of mixed separators", () => {
		expect(splitWords("hello___world")).toEqual(["hello", "world"]);
		expect(splitWords("hello - - world")).toEqual(["hello", "world"]);
	});

	it("should not split across non-ASCII letters (current behavior)", () => {
		// The splitWords regex uses ASCII [a-z][A-Z] — non-ASCII letters
		// are not recognized as word characters, so they stay glued together.
		expect(splitWords("héllo wörld")).toEqual(["héllo", "wörld"]);
	});

	it("should treat digits as part of the preceding word", () => {
		expect(splitWords("version2update")).toEqual(["version2update"]);
		expect(splitWords("item42_foo")).toEqual(["item42", "foo"]);
	});
});

describe("convertCase round-trips", () => {
	it("should roundtrip camelCase → snake_case → camelCase", () => {
		const original = "helloWorldExample";
		const snake = toSnakeCase(original);
		expect(snake).toBe("hello_world_example");
		expect(toCamelCase(snake)).toBe(original);
	});

	it("should roundtrip PascalCase → kebab-case → PascalCase", () => {
		const original = "HelloWorldExample";
		const kebab = toKebabCase(original);
		expect(kebab).toBe("hello-world-example");
		expect(toPascalCase(kebab)).toBe(original);
	});
});
