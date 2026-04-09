import { afterEach, describe, expect, it, vi } from "vitest";

const mockParse = vi.fn();

vi.mock("exifr", () => ({
	default: {
		parse: mockParse,
	},
}));

afterEach(() => {
	vi.restoreAllMocks();
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
