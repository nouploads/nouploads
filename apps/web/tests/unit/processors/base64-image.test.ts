import { describe, expect, it } from "vitest";
import {
	decodeBase64ToImage,
	encodeImageToBase64,
} from "~/features/developer-tools/processors/base64-image";

describe("encodeImageToBase64", () => {
	it("should encode a file to base64 with data URI prefix", async () => {
		const content = new Uint8Array([137, 80, 78, 71]); // PNG magic bytes
		const file = new File([content], "test.png", { type: "image/png" });
		const result = await encodeImageToBase64(file);

		expect(result.dataUri).toMatch(/^data:image\/png;base64,/);
		expect(result.rawBase64.length).toBeGreaterThan(0);
		expect(result.mimeType).toBe("image/png");
		expect(result.byteLength).toBe(4);
		expect(result.base64Length).toBeGreaterThan(0);
	});

	it("should handle JPEG files", async () => {
		const file = new File(["jpeg-data"], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await encodeImageToBase64(file);

		expect(result.dataUri).toMatch(/^data:image\/jpeg;base64,/);
		expect(result.mimeType).toBe("image/jpeg");
	});

	it("should fall back to application/octet-stream for unknown types", async () => {
		const file = new File(["data"], "test.bin", { type: "" });
		const result = await encodeImageToBase64(file);

		expect(result.mimeType).toBe("application/octet-stream");
	});
});

describe("decodeBase64ToImage", () => {
	it("should decode a data URI to a blob", async () => {
		const dataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
		const result = await decodeBase64ToImage(dataUri);

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.mimeType).toBe("image/png");
		expect(result.blob.size).toBeGreaterThan(0);
	});

	it("should detect JPEG from magic bytes in raw base64", async () => {
		// Create a minimal JPEG-like payload: FF D8 FF E0
		const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
		const binary = String.fromCharCode(...bytes);
		const raw = btoa(binary);

		const result = await decodeBase64ToImage(raw);
		expect(result.mimeType).toBe("image/jpeg");
	});

	it("should detect PNG from magic bytes in raw base64", async () => {
		// PNG magic: 89 50 4E 47
		const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
		const binary = String.fromCharCode(...bytes);
		const raw = btoa(binary);

		const result = await decodeBase64ToImage(raw);
		expect(result.mimeType).toBe("image/png");
	});

	it("should throw on invalid base64", async () => {
		await expect(decodeBase64ToImage("not-valid!!!")).rejects.toThrow();
	});

	it("should throw on invalid data URI format", async () => {
		await expect(
			decodeBase64ToImage("data:image/png;invalid-data"),
		).rejects.toThrow("Invalid data URI format");
	});

	it("should handle whitespace in input", async () => {
		const dataUri =
			"  data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==  ";
		const result = await decodeBase64ToImage(dataUri);

		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.mimeType).toBe("image/png");
	});
});
