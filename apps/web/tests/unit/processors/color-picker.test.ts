import { describe, expect, it } from "vitest";
import {
	allFormats,
	bestTextColor,
	contrastRatio,
	formatColor,
	parseToHex,
	randomHexColor,
	relativeLuminance,
	wcagLevel,
} from "~/features/developer-tools/processors/color-picker";

describe("parseToHex", () => {
	it("should parse hex strings", () => {
		expect(parseToHex("#3b82f6")).toBe("#3b82f6");
		expect(parseToHex("#fff")).toBe("#ffffff");
		expect(parseToHex("#000000")).toBe("#000000");
	});

	it("should parse rgb strings", () => {
		expect(parseToHex("rgb(59, 130, 246)")).toBe("#3b82f6");
		expect(parseToHex("rgb(0, 0, 0)")).toBe("#000000");
		expect(parseToHex("rgb(255, 255, 255)")).toBe("#ffffff");
	});

	it("should parse hsl strings", () => {
		expect(parseToHex("hsl(0, 100%, 50%)")).toBe("#ff0000");
	});

	it("should parse oklch strings", () => {
		const result = parseToHex("oklch(0.627 0.214 259.8)");
		expect(result).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("should parse named colors", () => {
		expect(parseToHex("red")).toBe("#ff0000");
		expect(parseToHex("white")).toBe("#ffffff");
		expect(parseToHex("blue")).toBe("#0000ff");
	});

	it("should parse CMYK strings", () => {
		const result = parseToHex("cmyk(0, 100, 100, 0)");
		expect(result).toBe("#ff0000");
	});

	it("should return null for invalid input", () => {
		expect(parseToHex("")).toBeNull();
		expect(parseToHex("notacolor")).toBeNull();
		expect(parseToHex("   ")).toBeNull();
	});
});

describe("formatColor", () => {
	// ── Pure red (#ff0000) — known exact values ──
	it("should format #ff0000 as hex", () => {
		expect(formatColor("#ff0000", "hex")).toBe("#ff0000");
	});

	it("should format #ff0000 as rgb", () => {
		expect(formatColor("#ff0000", "rgb")).toBe("255, 0, 0");
	});

	it("should format #ff0000 as hsl", () => {
		expect(formatColor("#ff0000", "hsl")).toBe("0, 100, 50");
	});

	it("should format #ff0000 as hsv", () => {
		expect(formatColor("#ff0000", "hsv")).toBe("0, 100, 100");
	});

	it("should format #ff0000 as hwb", () => {
		expect(formatColor("#ff0000", "hwb")).toBe("0, 0, 0");
	});

	it("should format #ff0000 as cmyk", () => {
		expect(formatColor("#ff0000", "cmyk")).toBe("0, 100, 100, 0");
	});

	it("should format #ff0000 as lab", () => {
		expect(formatColor("#ff0000", "lab")).toBe("54, 81, 70");
	});

	it("should format #ff0000 as lch", () => {
		expect(formatColor("#ff0000", "lch")).toBe("54, 107, 41");
	});

	it("should format #ff0000 as xyz", () => {
		expect(formatColor("#ff0000", "xyz")).toBe("41, 21, 2");
	});

	it("should format #ff0000 as luv", () => {
		expect(formatColor("#ff0000", "luv")).toBe("54, 175, 26");
	});

	it("should format #ff0000 as oklch", () => {
		expect(formatColor("#ff0000", "oklch")).toBe("0.628, 0.258, 29.2");
	});

	// ── Black edge case ──
	it("should format #000000 as cmyk", () => {
		expect(formatColor("#000000", "cmyk")).toBe("0, 0, 0, 100");
	});

	// ── White (#ffffff) — known exact values ──
	it("should format #ffffff correctly across formats", () => {
		expect(formatColor("#ffffff", "rgb")).toBe("255, 255, 255");
		expect(formatColor("#ffffff", "hsl")).toBe("0, 0, 100");
		expect(formatColor("#ffffff", "cmyk")).toBe("0, 0, 0, 0");
	});
});

describe("allFormats — cross-format accuracy for #388bff", () => {
	const formats = allFormats("#388bff");

	it("should return correct hex", () => {
		expect(formats.hex).toBe("#388bff");
	});

	it("should return correct rgb", () => {
		expect(formats.rgb).toBe("56, 139, 255");
	});

	it("should return correct hsl", () => {
		expect(formats.hsl).toBe("215, 100, 61");
	});

	it("should return correct hsv", () => {
		expect(formats.hsv).toBe("215, 78, 100");
	});

	it("should return correct hwb", () => {
		expect(formats.hwb).toBe("215, 22, 0");
	});

	it("should return correct cmyk", () => {
		expect(formats.cmyk).toBe("78, 45, 0, 0");
	});

	it("should return correct lab", () => {
		expect(formats.lab).toBe("58, 6, -66");
	});

	it("should return correct lch", () => {
		expect(formats.lch).toBe("58, 66, 275");
	});

	it("should return correct xyz", () => {
		expect(formats.xyz).toBe("29, 27, 98");
	});

	it("should return correct luv", () => {
		expect(formats.luv).toBe("58, -33, -93");
	});

	it("should return correct oklch", () => {
		expect(formats.oklch).toBe("0.647, 0.19, 257.7");
	});
});

describe("allFormats — returns all 11 keys", () => {
	it("should have all format keys", () => {
		const formats = allFormats("#ff0000");
		const keys = Object.keys(formats);
		expect(keys).toContain("hex");
		expect(keys).toContain("rgb");
		expect(keys).toContain("hsl");
		expect(keys).toContain("hsv");
		expect(keys).toContain("hwb");
		expect(keys).toContain("cmyk");
		expect(keys).toContain("lab");
		expect(keys).toContain("lch");
		expect(keys).toContain("xyz");
		expect(keys).toContain("luv");
		expect(keys).toContain("oklch");
	});
});

describe("relativeLuminance", () => {
	it("should return 0 for black", () => {
		expect(relativeLuminance("#000000")).toBeCloseTo(0, 3);
	});

	it("should return 1 for white", () => {
		expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 3);
	});

	it("should return ~0.2126 for pure red", () => {
		expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 3);
	});
});

describe("contrastRatio", () => {
	it("should return 21 for black on white", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
	});

	it("should return 1 for same color", () => {
		expect(contrastRatio("#3b82f6", "#3b82f6")).toBeCloseTo(1, 1);
	});

	it("should be symmetric", () => {
		const ab = contrastRatio("#3b82f6", "#ffffff");
		const ba = contrastRatio("#ffffff", "#3b82f6");
		expect(ab).toBeCloseTo(ba, 5);
	});
});

describe("bestTextColor", () => {
	it("should return white for dark backgrounds", () => {
		expect(bestTextColor("#000000")).toBe("#ffffff");
		expect(bestTextColor("#1a1a1a")).toBe("#ffffff");
		expect(bestTextColor("#1e3a5f")).toBe("#ffffff");
	});

	it("should return black for light backgrounds", () => {
		expect(bestTextColor("#ffffff")).toBe("#000000");
		expect(bestTextColor("#f0f0f0")).toBe("#000000");
		expect(bestTextColor("#ffff00")).toBe("#000000");
	});
});

describe("wcagLevel", () => {
	it("should return AAA for high contrast", () => {
		expect(wcagLevel(7.5)).toBe("AAA");
		expect(wcagLevel(21)).toBe("AAA");
	});

	it("should return AA for medium contrast", () => {
		expect(wcagLevel(4.5)).toBe("AA");
		expect(wcagLevel(6.9)).toBe("AA");
	});

	it("should return Fail for low contrast", () => {
		expect(wcagLevel(1)).toBe("Fail");
		expect(wcagLevel(4.4)).toBe("Fail");
	});
});

describe("randomHexColor", () => {
	it("should return a valid hex color", () => {
		const color = randomHexColor();
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("should return different colors on successive calls", () => {
		const colors = new Set(Array.from({ length: 10 }, () => randomHexColor()));
		expect(colors.size).toBeGreaterThan(1);
	});
});
