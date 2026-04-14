import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockParse = vi.fn();

vi.mock("exifr", () => ({
	default: {
		parse: mockParse,
	},
}));

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	mockParse.mockReset();
});

describe("readMetadataSummary", () => {
	it("should return empty summary when exifr returns null", async () => {
		mockParse.mockResolvedValue(null);
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.hasGps).toBe(false);
		expect(result.fieldCount).toBe(0);
		expect(result.camera).toBeUndefined();
		expect(result.gps).toBeUndefined();
	});

	it("should extract camera make and model", async () => {
		mockParse.mockResolvedValue({
			Make: "Canon",
			Model: "EOS R5",
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.camera).toBe("Canon EOS R5");
		expect(result.fieldCount).toBe(2);
	});

	it("should avoid duplicating make in camera string", async () => {
		mockParse.mockResolvedValue({
			Make: "Canon",
			Model: "Canon EOS R5",
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.camera).toBe("Canon EOS R5");
	});

	it("should detect GPS data", async () => {
		mockParse.mockResolvedValue({
			latitude: 37.7749,
			longitude: -122.4194,
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.hasGps).toBe(true);
		expect(result.gps).toEqual({ lat: 37.7749, lng: -122.4194 });
	});

	it("should extract date from DateTimeOriginal", async () => {
		mockParse.mockResolvedValue({
			DateTimeOriginal: new Date("2024-01-15T10:30:00"),
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.date).toContain("2024-01-15");
	});

	it("should extract software field", async () => {
		mockParse.mockResolvedValue({
			Software: "Adobe Lightroom 6.0",
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.software).toBe("Adobe Lightroom 6.0");
	});

	it("should extract image dimensions from EXIF", async () => {
		mockParse.mockResolvedValue({
			ImageWidth: 4000,
			ImageHeight: 3000,
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.dimensions).toEqual({ width: 4000, height: 3000 });
	});

	it("should handle model-only (no make)", async () => {
		mockParse.mockResolvedValue({
			Model: "iPhone 15 Pro",
		});
		const { readMetadataSummary } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await readMetadataSummary(file);

		expect(result.camera).toBe("iPhone 15 Pro");
	});
});

describe("stripMetadata", () => {
	function stubBrowserCanvas({
		width = 800,
		height = 600,
		outputBlob,
	}: {
		width?: number;
		height?: number;
		outputBlob: Blob;
	}) {
		const closeBitmap = vi.fn();
		vi.stubGlobal(
			"createImageBitmap",
			vi.fn(() => Promise.resolve({ width, height, close: closeBitmap })),
		);

		const drawImage = vi.fn();
		const convertToBlob = vi.fn(() => Promise.resolve(outputBlob));
		const ctx = { drawImage };
		const offscreen = vi.fn().mockImplementation(function OffscreenCanvas(
			this: { width: number; height: number },
			w: number,
			h: number,
		) {
			this.width = w;
			this.height = h;
			return {
				width: w,
				height: h,
				getContext: vi.fn(() => ctx),
				convertToBlob,
			};
		}) as unknown as typeof globalThis.OffscreenCanvas;
		vi.stubGlobal("OffscreenCanvas", offscreen);

		return { closeBitmap, drawImage, convertToBlob };
	}

	beforeEach(() => {
		// Default: exifr returns minimal metadata
		mockParse.mockResolvedValue({ Make: "Canon", Model: "EOS R5" });
	});

	it("should strip metadata from a JPG and produce a JPEG blob", async () => {
		const outputBlob = new Blob([new Uint8Array(512)], { type: "image/jpeg" });
		const { convertToBlob } = stubBrowserCanvas({
			width: 1024,
			height: 768,
			outputBlob,
		});
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(1024)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await stripMetadata(input);

		expect(result.blob).toBe(outputBlob);
		expect(result.blob.type).toBe("image/jpeg");
		expect(result.originalSize).toBe(1024);
		expect(result.strippedSize).toBe(outputBlob.size);
		expect(result.metadataBefore.camera).toBe("Canon EOS R5");
		expect(result.metadataBefore.dimensions).toEqual({
			width: 1024,
			height: 768,
		});
		expect(convertToBlob).toHaveBeenCalledWith(
			expect.objectContaining({ type: "image/jpeg" }),
		);
	});

	it("should preserve PNG output type for PNG input", async () => {
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/png" });
		const { convertToBlob } = stubBrowserCanvas({ outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.png", {
			type: "image/png",
		});
		await stripMetadata(input);

		// PNG path must not pass a quality (canvas encodes PNG losslessly)
		expect(convertToBlob).toHaveBeenCalledWith({
			type: "image/png",
			quality: undefined,
		});
	});

	it("should fall back to PNG for unknown input types", async () => {
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/png" });
		const { convertToBlob } = stubBrowserCanvas({ outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.bmp", {
			type: "image/bmp",
		});
		await stripMetadata(input);

		expect(convertToBlob).toHaveBeenCalledWith(
			expect.objectContaining({ type: "image/png" }),
		);
	});

	it("should honor custom quality for JPEG output", async () => {
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/jpeg" });
		const { convertToBlob } = stubBrowserCanvas({ outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.jpg", {
			type: "image/jpeg",
		});
		await stripMetadata(input, { quality: 50 });

		expect(convertToBlob).toHaveBeenCalledWith({
			type: "image/jpeg",
			quality: 0.5,
		});
	});

	it("should update metadataBefore.dimensions from the decoded bitmap", async () => {
		// exifr reports different (lying) dimensions — bitmap dimensions should win
		mockParse.mockResolvedValue({ ImageWidth: 4000, ImageHeight: 3000 });
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/jpeg" });
		stubBrowserCanvas({ width: 2000, height: 1500, outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await stripMetadata(input);

		expect(result.metadataBefore.dimensions).toEqual({
			width: 2000,
			height: 1500,
		});
	});

	it("should close the bitmap to release memory", async () => {
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/jpeg" });
		const { closeBitmap } = stubBrowserCanvas({ outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.jpg", {
			type: "image/jpeg",
		});
		await stripMetadata(input);

		expect(closeBitmap).toHaveBeenCalled();
	});

	it("should throw AbortError if signal is already aborted", async () => {
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/jpeg" });
		stubBrowserCanvas({ outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File([new Uint8Array(800)], "photo.jpg", {
			type: "image/jpeg",
		});
		await expect(
			stripMetadata(input, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});

	it("should throw AbortError if signal aborts after metadata read", async () => {
		const controller = new AbortController();
		// Abort as soon as exifr.parse is called
		mockParse.mockImplementation(async () => {
			controller.abort();
			return { Make: "Canon", Model: "EOS R5" };
		});
		const outputBlob = new Blob([new Uint8Array(400)], { type: "image/jpeg" });
		stubBrowserCanvas({ outputBlob });
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.jpg", {
			type: "image/jpeg",
		});
		await expect(
			stripMetadata(input, { signal: controller.signal }),
		).rejects.toThrow("Aborted");
	});
});
