import { describe, expect, it } from "vitest";
import {
	csvToJson,
	escapeCSVField,
	flattenObject,
	jsonToCsv,
	MAX_INPUT_SIZE,
	parseCSVLine,
} from "~/features/developer-tools/processors/json-csv";

describe("flattenObject", () => {
	it("should flatten a simple nested object", () => {
		const result = flattenObject({ user: { name: "Alice" } });
		expect(result).toEqual({ "user.name": "Alice" });
	});

	it("should flatten deeply nested objects", () => {
		const result = flattenObject({
			a: { b: { c: { d: "deep" } } },
		});
		expect(result).toEqual({ "a.b.c.d": "deep" });
	});

	it("should handle mixed nesting", () => {
		const result = flattenObject({
			name: "Alice",
			address: { city: "Paris", country: "France" },
		});
		expect(result).toEqual({
			name: "Alice",
			"address.city": "Paris",
			"address.country": "France",
		});
	});

	it("should leave arrays as-is (not flatten them)", () => {
		const result = flattenObject({ tags: ["a", "b"] });
		expect(result).toEqual({ tags: ["a", "b"] });
	});

	it("should handle null values", () => {
		const result = flattenObject({ key: null });
		expect(result).toEqual({ key: null });
	});

	it("should handle empty object", () => {
		const result = flattenObject({});
		expect(result).toEqual({});
	});

	it("should handle a flat object (no nesting)", () => {
		const result = flattenObject({ a: 1, b: "two" });
		expect(result).toEqual({ a: 1, b: "two" });
	});
});

describe("escapeCSVField", () => {
	it("should return the value unchanged if no special characters", () => {
		expect(escapeCSVField("hello", ",")).toBe("hello");
	});

	it("should wrap in quotes if value contains the delimiter", () => {
		expect(escapeCSVField("hello, world", ",")).toBe('"hello, world"');
	});

	it("should wrap in quotes if value contains double quotes", () => {
		expect(escapeCSVField('say "hi"', ",")).toBe('"say ""hi"""');
	});

	it("should wrap in quotes if value contains newline", () => {
		expect(escapeCSVField("line1\nline2", ",")).toBe('"line1\nline2"');
	});

	it("should wrap in quotes if value contains carriage return", () => {
		expect(escapeCSVField("line1\rline2", ",")).toBe('"line1\rline2"');
	});

	it("should handle tab delimiter", () => {
		expect(escapeCSVField("hello\tworld", "\t")).toBe('"hello\tworld"');
	});

	it("should handle semicolon delimiter", () => {
		expect(escapeCSVField("a;b", ";")).toBe('"a;b"');
	});

	it("should handle empty string", () => {
		expect(escapeCSVField("", ",")).toBe("");
	});
});

describe("parseCSVLine", () => {
	it("should parse a simple CSV line", () => {
		expect(parseCSVLine("a,b,c", ",")).toEqual(["a", "b", "c"]);
	});

	it("should parse quoted fields", () => {
		expect(parseCSVLine('"hello, world",b,c', ",")).toEqual([
			"hello, world",
			"b",
			"c",
		]);
	});

	it("should parse escaped double quotes", () => {
		expect(parseCSVLine('"say ""hi""",b', ",")).toEqual(['say "hi"', "b"]);
	});

	it("should parse tab-delimited line", () => {
		expect(parseCSVLine("a\tb\tc", "\t")).toEqual(["a", "b", "c"]);
	});

	it("should parse semicolon-delimited line", () => {
		expect(parseCSVLine("a;b;c", ";")).toEqual(["a", "b", "c"]);
	});

	it("should handle empty fields", () => {
		expect(parseCSVLine("a,,c", ",")).toEqual(["a", "", "c"]);
	});

	it("should handle single field", () => {
		expect(parseCSVLine("only", ",")).toEqual(["only"]);
	});
});

describe("jsonToCsv", () => {
	it("should convert a simple JSON array to CSV", () => {
		const input = JSON.stringify([
			{ name: "Alice", age: 30 },
			{ name: "Bob", age: 25 },
		]);
		const result = jsonToCsv(input);
		expect(result).toBe("name,age\nAlice,30\nBob,25");
	});

	it("should handle values with commas (RFC 4180 quoting)", () => {
		const input = JSON.stringify([{ note: "hello, world" }]);
		const result = jsonToCsv(input);
		expect(result).toBe('note\n"hello, world"');
	});

	it("should handle nested objects with flatten=true", () => {
		const input = JSON.stringify([{ user: { name: "Alice" } }]);
		const result = jsonToCsv(input, { flatten: true });
		expect(result).toBe("user.name\nAlice");
	});

	it("should NOT flatten when flatten=false", () => {
		const input = JSON.stringify([{ user: { name: "Alice" } }]);
		const result = jsonToCsv(input, { flatten: false });
		// Nested object is serialized as JSON string, then RFC 4180 quoted (inner quotes doubled)
		expect(result).toBe('user\n"{""name"":""Alice""}"');
	});

	it("should union all keys across all rows", () => {
		const input = JSON.stringify([{ a: 1 }, { b: 2 }, { a: 3, b: 4 }]);
		const result = jsonToCsv(input);
		const lines = result.split("\n");
		expect(lines[0]).toBe("a,b");
		expect(lines[1]).toBe("1,");
		expect(lines[2]).toBe(",2");
		expect(lines[3]).toBe("3,4");
	});

	it("should return empty string for empty array", () => {
		expect(jsonToCsv("[]")).toBe("");
	});

	it("should throw for non-array JSON", () => {
		expect(() => jsonToCsv('{"key":"value"}')).toThrow(
			"Input must be a JSON array",
		);
	});

	it("should throw for malformed JSON", () => {
		expect(() => jsonToCsv("{invalid}")).toThrow();
	});

	it("should throw for array of non-objects", () => {
		expect(() => jsonToCsv("[1, 2, 3]")).toThrow(
			"Each element in the JSON array must be an object",
		);
	});

	it("should handle null values in objects", () => {
		const input = JSON.stringify([{ a: 1, b: null }]);
		const result = jsonToCsv(input);
		expect(result).toBe("a,b\n1,");
	});

	it("should handle values with double quotes", () => {
		const input = JSON.stringify([{ text: 'say "hi"' }]);
		const result = jsonToCsv(input);
		expect(result).toBe('text\n"say ""hi"""');
	});

	it("should use tab delimiter when specified", () => {
		const input = JSON.stringify([{ name: "Alice", age: 30 }]);
		const result = jsonToCsv(input, { delimiter: "\t" });
		expect(result).toBe("name\tage\nAlice\t30");
	});

	it("should use semicolon delimiter when specified", () => {
		const input = JSON.stringify([{ name: "Alice", age: 30 }]);
		const result = jsonToCsv(input, { delimiter: ";" });
		expect(result).toBe("name;age\nAlice;30");
	});

	it("should exclude headers when includeHeaders=false", () => {
		const input = JSON.stringify([{ name: "Alice", age: 30 }]);
		const result = jsonToCsv(input, { includeHeaders: false });
		expect(result).toBe("Alice,30");
	});
});

describe("csvToJson", () => {
	it("should convert simple CSV to JSON array", () => {
		const input = "name,age\nAlice,30\nBob,25";
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([
			{ name: "Alice", age: "30" },
			{ name: "Bob", age: "25" },
		]);
	});

	it("should handle quoted fields with commas", () => {
		const input = 'note\n"hello, world"';
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ note: "hello, world" }]);
	});

	it("should handle quoted fields with escaped double quotes", () => {
		const input = 'text\n"say ""hi"""';
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ text: 'say "hi"' }]);
	});

	it("should return empty array for empty input", () => {
		expect(csvToJson("")).toBe("[]");
		expect(csvToJson("  ")).toBe("[]");
	});

	it("should handle header-only CSV (no data rows)", () => {
		const result = csvToJson("name,age");
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([]);
	});

	it("should handle tab delimiter", () => {
		const input = "name\tage\nAlice\t30";
		const result = csvToJson(input, { delimiter: "\t" });
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ name: "Alice", age: "30" }]);
	});

	it("should handle semicolon delimiter", () => {
		const input = "name;age\nAlice;30";
		const result = csvToJson(input, { delimiter: ";" });
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ name: "Alice", age: "30" }]);
	});

	it("should handle missing values (fill with empty string)", () => {
		const input = "a,b,c\n1,,3";
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ a: "1", b: "", c: "3" }]);
	});
});

describe("CSV edge cases", () => {
	it("should parse CRLF line endings", () => {
		const input = "a,b\r\n1,2\r\n3,4";
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([
			{ a: "1", b: "2" },
			{ a: "3", b: "4" },
		]);
	});

	it("should parse quoted fields containing newlines spanning multiple physical lines", () => {
		const input = 'note,tag\n"line1\nline2",ok';
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ note: "line1\nline2", tag: "ok" }]);
	});

	it("should throw on empty header row", () => {
		expect(() => csvToJson(",,\n1,2,3")).toThrow(/header row/);
	});

	it("should handle trailing newline after last data row", () => {
		const input = "a,b\n1,2\n";
		const result = csvToJson(input);
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([{ a: "1", b: "2" }]);
	});
});

describe("roundtrip", () => {
	it("should roundtrip JSON→CSV→JSON preserving string values", () => {
		const original = [
			{ name: "Alice", age: "30" },
			{ name: "Bob", age: "25" },
		];
		const csv = jsonToCsv(JSON.stringify(original));
		const json = csvToJson(csv);
		expect(JSON.parse(json)).toEqual(original);
	});

	it("should roundtrip with comma-containing values", () => {
		const original = [{ city: "London, UK", country: "England" }];
		const csv = jsonToCsv(JSON.stringify(original));
		const json = csvToJson(csv);
		expect(JSON.parse(json)).toEqual(original);
	});
});

describe("MAX_INPUT_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_INPUT_SIZE).toBe(10 * 1024 * 1024);
	});
});
