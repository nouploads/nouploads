import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();

const tick = () => new Promise((r) => setTimeout(r, 0));

const mockParse = vi.fn();

vi.mock("exifr", () => ({
	default: {
		parse: mockParse,
	},
}));

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});

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
	function mockStripResponse(
		mime = "image/jpeg",
		width?: number,
		height?: number,
	) {
		return {
			output: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
			extension: mime === "image/png" ? ".png" : ".jpg",
			mimeType: mime,
			metadata: width && height ? { width, height } : {},
		};
	}

	beforeEach(() => {
		// Default: exifr returns minimal metadata
		mockParse.mockResolvedValue({ Make: "Canon", Model: "EOS R5" });
	});

	it("should strip metadata via pipeline worker and return a blob", async () => {
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(1024)], "photo.jpg", {
			type: "image/jpeg",
		});
		const promise = stripMetadata(input);
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "strip-metadata",
				options: expect.objectContaining({ quality: 92 }),
			}),
		);

		worker.simulateMessage(mockStripResponse("image/jpeg", 1024, 768));
		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("image/jpeg");
		expect(result.originalSize).toBe(1024);
		expect(result.metadataBefore.camera).toBe("Canon EOS R5");
		expect(result.metadataBefore.dimensions).toEqual({
			width: 1024,
			height: 768,
		});
	});

	it("should honor custom quality", async () => {
		const { stripMetadata } = await import(
			"~/features/image-tools/processors/strip-metadata"
		);

		const input = new File([new Uint8Array(800)], "photo.jpg", {
			type: "image/jpeg",
		});
		const promise = stripMetadata(input, { quality: 50 });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({ quality: 50 }),
			}),
		);

		worker.simulateMessage(mockStripResponse("image/jpeg"));
		await promise;
	});

	it("should throw AbortError if signal is already aborted", async () => {
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
		mockParse.mockImplementation(async () => {
			controller.abort();
			return { Make: "Canon", Model: "EOS R5" };
		});
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
