import { describe, expect, it } from "vitest";
import {
	generateQrCode,
	MAX_QR_LENGTH,
} from "~/features/developer-tools/processors/qr-code";

describe("generateQrCode", () => {
	it("should generate a QR code with default options", async () => {
		const result = await generateQrCode({ text: "Hello World" });
		expect(result.pngDataUrl).toMatch(/^data:image\/png;base64,/);
		expect(result.svgString).toContain("<svg");
		expect(result.pngBlob).toBeInstanceOf(Blob);
		expect(result.svgBlob).toBeInstanceOf(Blob);
	});

	it("should generate PNG blob with valid magic bytes", async () => {
		const result = await generateQrCode({ text: "test" });
		const bytes = new Uint8Array(await result.pngBlob.arrayBuffer());
		// PNG magic bytes: 89 50 4E 47
		expect(bytes[0]).toBe(0x89);
		expect(bytes[1]).toBe(0x50);
		expect(bytes[2]).toBe(0x4e);
		expect(bytes[3]).toBe(0x47);
	});

	it("should generate SVG blob with valid content", async () => {
		const result = await generateQrCode({ text: "test" });
		const svgText = await result.svgBlob.text();
		expect(svgText).toContain("<svg");
		expect(svgText).toContain("</svg>");
	});

	it("should throw on empty text", async () => {
		await expect(generateQrCode({ text: "" })).rejects.toThrow(
			"Text is required",
		);
	});

	it("should throw on whitespace-only text", async () => {
		await expect(generateQrCode({ text: "   " })).rejects.toThrow(
			"Text is required",
		);
	});

	it("should respect custom colors", async () => {
		const result = await generateQrCode({
			text: "test",
			foreground: "#ff0000",
			background: "#00ff00",
		});
		expect(result.svgString).toContain("#ff0000");
		expect(result.svgString).toContain("#00ff00");
	});

	it("should respect custom size", async () => {
		const result = await generateQrCode({ text: "test", size: 512 });
		expect(result.pngDataUrl).toMatch(/^data:image\/png;base64,/);
		expect(result.pngBlob.size).toBeGreaterThan(0);
	});

	it("should respect custom error correction", async () => {
		const resultL = await generateQrCode({
			text: "test",
			errorCorrection: "L",
		});
		const resultH = await generateQrCode({
			text: "test",
			errorCorrection: "H",
		});
		// Higher error correction produces a denser (larger) QR code
		expect(resultH.pngBlob.size).not.toBe(resultL.pngBlob.size);
	});

	it("should encode a URL correctly", async () => {
		const result = await generateQrCode({
			text: "https://example.com/path?query=value",
		});
		expect(result.pngDataUrl).toMatch(/^data:image\/png;base64,/);
		expect(result.svgString).toContain("<svg");
	});
});

describe("MAX_QR_LENGTH", () => {
	it("should be 4296", () => {
		expect(MAX_QR_LENGTH).toBe(4296);
	});
});
