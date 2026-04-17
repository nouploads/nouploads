import { describe, expect, it } from "vitest";
import {
	detectFormat,
	jsonToXml,
	MAX_INPUT_SIZE,
	normalizeSmartQuotes,
	validateJson,
	validateXml,
	xmlToJson,
} from "~/features/developer-tools/processors/xml-json";

describe("xmlToJson", () => {
	it("should convert a simple XML element", () => {
		const result = xmlToJson("<root><name>Alice</name></root>");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.root.name).toBe("Alice");
	});

	it("should convert numeric text content to numbers", () => {
		const result = xmlToJson("<root><age>30</age></root>");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.root.age).toBe(30);
	});

	it("should preserve attributes with @_ prefix", () => {
		const result = xmlToJson('<user id="42" role="admin">Alice</user>');
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.user["@_id"]).toBe(42);
		expect(parsed.user["@_role"]).toBe("admin");
	});

	it("should convert repeated elements to arrays", () => {
		const result = xmlToJson(
			"<items><item>a</item><item>b</item><item>c</item></items>",
		);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(Array.isArray(parsed.items.item)).toBe(true);
		expect(parsed.items.item).toEqual(["a", "b", "c"]);
	});

	it("should handle nested elements", () => {
		const result = xmlToJson("<a><b><c><d>deep</d></c></b></a>");
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.a.b.c.d).toBe("deep");
	});

	it("should respect indent option", () => {
		const result = xmlToJson("<r><n>1</n></r>", 4);
		expect(result.error).toBeUndefined();
		expect(result.output).toMatch(/\n {4}"r"/);
	});

	it("should handle XML declaration prologue", () => {
		const result = xmlToJson(
			'<?xml version="1.0" encoding="UTF-8"?><root><n>1</n></root>',
		);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.root.n).toBe(1);
	});

	it("should handle self-closing tags", () => {
		const result = xmlToJson('<root><item id="1"/><item id="2"/></root>');
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(Array.isArray(parsed.root.item)).toBe(true);
		expect(parsed.root.item[0]["@_id"]).toBe(1);
	});
});

describe("jsonToXml", () => {
	it("should convert a simple JSON object", () => {
		const result = jsonToXml('{"root":{"name":"Alice","age":30}}');
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("<root>");
		expect(result.output).toContain("<name>Alice</name>");
		expect(result.output).toContain("<age>30</age>");
		expect(result.output).toContain("</root>");
	});

	it("should convert arrays to repeated elements", () => {
		const result = jsonToXml('{"items":{"item":["a","b","c"]}}');
		expect(result.error).toBeUndefined();
		expect(result.output).toContain("<item>a</item>");
		expect(result.output).toContain("<item>b</item>");
		expect(result.output).toContain("<item>c</item>");
	});

	it("should restore @_-prefixed keys as XML attributes", () => {
		const result = jsonToXml('{"user":{"@_id":"42","@_role":"admin"}}');
		expect(result.error).toBeUndefined();
		expect(result.output).toMatch(/<user[^>]*id="42"/);
		expect(result.output).toMatch(/role="admin"/);
	});

	it("should respect indent option", () => {
		const result = jsonToXml('{"root":{"child":"hello"}}', 4);
		expect(result.error).toBeUndefined();
		expect(result.output).toMatch(/^ {4}<child>/m);
	});

	it("should return error for invalid JSON", () => {
		const result = jsonToXml("{invalid}");
		expect(result.error).toBeDefined();
		expect(result.output).toBe("");
	});
});

describe("detectFormat", () => {
	it("should detect XML by leading <", () => {
		expect(detectFormat("<root/>")).toBe("xml");
		expect(detectFormat('<?xml version="1.0"?><root/>')).toBe("xml");
	});

	it("should detect JSON objects", () => {
		expect(detectFormat('{"a":1}')).toBe("json");
	});

	it("should detect JSON arrays", () => {
		expect(detectFormat("[1,2,3]")).toBe("json");
	});

	it("should detect JSON with leading whitespace", () => {
		expect(detectFormat('   {"a":1}')).toBe("json");
	});

	it("should return unknown for empty string", () => {
		expect(detectFormat("")).toBe("unknown");
		expect(detectFormat("   ")).toBe("unknown");
	});

	it("should return unknown for plain text", () => {
		expect(detectFormat("hello world")).toBe("unknown");
	});
});

describe("validateXml", () => {
	it("should return valid for a well-formed document", () => {
		const result = validateXml("<root><child>value</child></root>");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should return invalid for an empty string", () => {
		const result = validateXml("");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Empty input");
	});

	it("should return invalid for unclosed tags", () => {
		const result = validateXml("<root><child>value</root>");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("should return invalid for mismatched tags", () => {
		const result = validateXml("<root><a>1</b></root>");
		expect(result.valid).toBe(false);
	});

	it("should accept XML prologue", () => {
		const result = validateXml(
			'<?xml version="1.0"?><root><child>a</child></root>',
		);
		expect(result.valid).toBe(true);
	});

	it("should accept leading whitespace before the XML declaration", () => {
		const indented = `  <?xml version="1.0" encoding="UTF-8"?>
  <library>
    <book isbn="978-0-13-468599-1"><title>The C Programming Language</title></book>
  </library>`;
		const result = validateXml(indented);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});
});

describe("validateJson", () => {
	it("should return valid for well-formed JSON", () => {
		expect(validateJson('{"a":1}').valid).toBe(true);
		expect(validateJson("[1,2,3]").valid).toBe(true);
	});

	it("should return invalid for malformed JSON", () => {
		const result = validateJson("{invalid}");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("should return invalid for empty input", () => {
		const result = validateJson("");
		expect(result.valid).toBe(false);
	});
});

describe("normalizeSmartQuotes", () => {
	it("should replace curly double quotes with ASCII double quotes", () => {
		expect(normalizeSmartQuotes("\u201Chello\u201D")).toBe('"hello"');
	});

	it("should replace curly single quotes with ASCII apostrophes", () => {
		expect(normalizeSmartQuotes("it\u2019s fine")).toBe("it's fine");
	});

	it("should replace low-quote variants too", () => {
		expect(normalizeSmartQuotes("\u201Ea\u201F")).toBe('"a"');
	});

	it("should leave ASCII quotes alone", () => {
		expect(normalizeSmartQuotes('"hello"')).toBe('"hello"');
	});
});

describe("smart-quote XML input (regression)", () => {
	// Copy-pasting XML from markdown renderers, word processors, and some
	// chat apps substitutes Unicode smart quotes for ASCII quotes. The
	// underlying fast-xml-parser parser then silently drops the attributes
	// while the validator reports "Attribute X is without value." This test
	// pins the normalization behavior that papers over the mismatch.
	const smartXml = `<?xml version=\u201C1.0\u201D encoding=\u201CUTF-8\u201D?>
<library>
  <book isbn=\u201C978-0-13-468599-1\u201D available=\u201Ctrue\u201D>
    <title>The C Programming Language</title>
  </book>
</library>`;

	it("should validate smart-quoted XML as valid", () => {
		const result = validateXml(smartXml);
		expect(result.valid).toBe(true);
	});

	it("should preserve attributes when converting smart-quoted XML to JSON", () => {
		const result = xmlToJson(smartXml);
		expect(result.error).toBeUndefined();
		const parsed = JSON.parse(result.output);
		expect(parsed.library.book["@_isbn"]).toBe("978-0-13-468599-1");
		expect(parsed.library.book["@_available"]).toBe(true);
	});
});

describe("roundtrip", () => {
	it("should roundtrip XML → JSON → XML preserving structure", () => {
		const original = '<root><user id="1"><name>Alice</name></user></root>';
		const jsonResult = xmlToJson(original);
		expect(jsonResult.error).toBeUndefined();
		const xmlResult = jsonToXml(jsonResult.output);
		expect(xmlResult.error).toBeUndefined();
		expect(xmlResult.output).toContain("<name>Alice</name>");
		expect(xmlResult.output).toMatch(/id="1"/);
	});
});

describe("MAX_INPUT_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_INPUT_SIZE).toBe(10 * 1024 * 1024);
	});
});
