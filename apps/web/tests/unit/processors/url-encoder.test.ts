import { describe, expect, it } from "vitest";
import {
	decodeUrl,
	encodeUrl,
	isValidUrl,
	parseUrl,
} from "~/features/developer-tools/processors/url-encoder";

describe("encodeUrl", () => {
	it("should encode a component string", () => {
		const result = encodeUrl("hello world&foo=bar", "component");
		expect(result).toBe("hello%20world%26foo%3Dbar");
	});

	it("should encode a full URL preserving structure", () => {
		const result = encodeUrl("https://example.com/path?q=hello world", "full");
		expect(result).toBe("https://example.com/path?q=hello%20world");
	});

	it("should encode unicode characters", () => {
		const result = encodeUrl("caf\u00e9", "component");
		expect(result).toBe("caf%C3%A9");
	});

	it("should handle empty string", () => {
		expect(encodeUrl("", "component")).toBe("");
		expect(encodeUrl("", "full")).toBe("");
	});

	it("should encode special characters in component mode", () => {
		const result = encodeUrl("key=value&other=test", "component");
		expect(result).toContain("%3D");
		expect(result).toContain("%26");
	});

	it("should preserve structural characters in full mode", () => {
		const result = encodeUrl(
			"https://example.com/path?key=value&other=test",
			"full",
		);
		expect(result).toContain("://");
		expect(result).toContain("?");
		expect(result).toContain("&");
		expect(result).toContain("=");
	});
});

describe("decodeUrl", () => {
	it("should decode a component string", () => {
		const result = decodeUrl("hello%20world%26foo%3Dbar", "component");
		expect(result).toBe("hello world&foo=bar");
	});

	it("should decode a full URL", () => {
		const result = decodeUrl(
			"https://example.com/path?q=hello%20world",
			"full",
		);
		expect(result).toBe("https://example.com/path?q=hello world");
	});

	it("should handle already decoded string", () => {
		expect(decodeUrl("hello world", "component")).toBe("hello world");
	});

	it("should handle empty string", () => {
		expect(decodeUrl("", "component")).toBe("");
		expect(decodeUrl("", "full")).toBe("");
	});
});

describe("round-trip", () => {
	it("should round-trip component encode then decode", () => {
		const original = "hello world&foo=bar";
		const encoded = encodeUrl(original, "component");
		const decoded = decodeUrl(encoded, "component");
		expect(decoded).toBe(original);
	});

	it("should round-trip full URL encode then decode", () => {
		const original = "https://example.com/path?q=hello world&lang=en";
		const encoded = encodeUrl(original, "full");
		const decoded = decodeUrl(encoded, "full");
		expect(decoded).toBe(original);
	});

	it("should round-trip unicode characters", () => {
		const original = "\u3053\u3093\u306b\u3061\u306f\u4e16\u754c";
		const encoded = encodeUrl(original, "component");
		const decoded = decodeUrl(encoded, "component");
		expect(decoded).toBe(original);
	});
});

describe("parseUrl", () => {
	it("should parse a URL with query parameters", () => {
		const result = parseUrl("https://example.com/path?q=hello%20world&lang=en");
		expect(result).not.toBeNull();
		expect(result?.protocol).toBe("https:");
		expect(result?.host).toBe("example.com");
		expect(result?.pathname).toBe("/path");
		expect(result?.search).toBe("?q=hello%20world&lang=en");
		expect(result?.hash).toBe("");
		expect(result?.params).toHaveLength(2);
		expect(result?.params[0].key).toBe("q");
		expect(result?.params[0].value).toBe("hello world");
		expect(result?.params[1].key).toBe("lang");
		expect(result?.params[1].value).toBe("en");
	});

	it("should parse a URL with a hash", () => {
		const result = parseUrl("https://example.com/page#section-1");
		expect(result).not.toBeNull();
		expect(result?.hash).toBe("#section-1");
	});

	it("should parse a URL without query parameters", () => {
		const result = parseUrl("https://example.com/path");
		expect(result).not.toBeNull();
		expect(result?.params).toHaveLength(0);
		expect(result?.search).toBe("");
	});

	it("should return null for invalid input", () => {
		expect(parseUrl("not a url")).toBeNull();
	});

	it("should return null for empty string", () => {
		expect(parseUrl("")).toBeNull();
	});

	it("should parse URL with port", () => {
		const result = parseUrl("http://localhost:3000/api");
		expect(result).not.toBeNull();
		expect(result?.host).toBe("localhost:3000");
	});
});

describe("isValidUrl", () => {
	it("should return true for a valid URL", () => {
		expect(isValidUrl("https://example.com")).toBe(true);
	});

	it("should return true for a URL with query params", () => {
		expect(isValidUrl("https://example.com/path?q=test")).toBe(true);
	});

	it("should return false for plain text", () => {
		expect(isValidUrl("not a url")).toBe(false);
	});

	it("should return false for empty string", () => {
		expect(isValidUrl("")).toBe(false);
	});

	it("should return true for http URL", () => {
		expect(isValidUrl("http://example.com")).toBe(true);
	});

	it("should return false for a string with no protocol", () => {
		expect(isValidUrl("example.com")).toBe(false);
	});
});
