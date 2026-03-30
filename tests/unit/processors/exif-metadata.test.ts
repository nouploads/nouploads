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

describe("parseExifData", () => {
	it("should return empty data when exifr returns null", async () => {
		mockParse.mockResolvedValue(null);
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.hasGps).toBe(false);
		expect(result.raw).toEqual({});
		expect(result.camera).toBeUndefined();
	});

	it("should group camera fields correctly", async () => {
		mockParse.mockResolvedValue({
			Make: "Canon",
			Model: "EOS R5",
			Software: "Lightroom",
			FNumber: 2.8,
			ISO: 400,
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.camera).toEqual({
			Make: "Canon",
			Model: "EOS R5",
			Software: "Lightroom",
		});
		expect(result.exposure).toEqual({
			FNumber: 2.8,
			ISO: 400,
		});
	});

	it("should group lens fields correctly", async () => {
		mockParse.mockResolvedValue({
			LensModel: "RF 50mm F1.2L",
			FocalLength: 50,
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.lens).toEqual({
			LensModel: "RF 50mm F1.2L",
			FocalLength: 50,
		});
	});

	it("should detect GPS data and set hasGps true", async () => {
		mockParse.mockResolvedValue({
			latitude: 37.7749,
			longitude: -122.4194,
			GPSAltitude: 10,
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.hasGps).toBe(true);
		expect(result.gps).toEqual({
			latitude: 37.7749,
			longitude: -122.4194,
			GPSAltitude: 10,
		});
	});

	it("should set hasGps false when no GPS data present", async () => {
		mockParse.mockResolvedValue({
			Make: "Nikon",
			Model: "Z6",
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.hasGps).toBe(false);
	});

	it("should group image fields correctly", async () => {
		mockParse.mockResolvedValue({
			ImageWidth: 4000,
			ImageHeight: 3000,
			Orientation: 1,
			ColorSpace: "sRGB",
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.image).toEqual({
			ImageWidth: 4000,
			ImageHeight: 3000,
			Orientation: 1,
			ColorSpace: "sRGB",
		});
	});

	it("should place unrecognized fields in other", async () => {
		mockParse.mockResolvedValue({
			Make: "Sony",
			CustomField: "custom-value",
			AnotherField: 42,
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.camera).toEqual({ Make: "Sony" });
		expect(result.other).toEqual({
			CustomField: "custom-value",
			AnotherField: 42,
		});
	});

	it("should serialize object values as JSON strings", async () => {
		mockParse.mockResolvedValue({
			Make: "Canon",
			SomeArray: [1, 2, 3],
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.camera).toEqual({ Make: "Canon" });
		expect(result.other?.SomeArray).toBe("[1,2,3]");
	});

	it("should skip null and undefined values", async () => {
		mockParse.mockResolvedValue({
			Make: "Canon",
			Model: null,
			Software: undefined,
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.camera).toEqual({ Make: "Canon" });
	});

	it("should include exposure fields", async () => {
		mockParse.mockResolvedValue({
			ExposureTime: "1/250",
			FNumber: 5.6,
			ISO: 200,
			Flash: "No Flash",
			WhiteBalance: "Auto",
			MeteringMode: "Multi-segment",
		});
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.exposure).toEqual({
			ExposureTime: "1/250",
			FNumber: 5.6,
			ISO: 200,
			Flash: "No Flash",
			WhiteBalance: "Auto",
			MeteringMode: "Multi-segment",
		});
	});

	it("should preserve raw data", async () => {
		const rawData = {
			Make: "Fujifilm",
			Model: "X-T4",
			CustomTag: "value",
		};
		mockParse.mockResolvedValue(rawData);
		const { parseExifData } = await import(
			"~/features/image-tools/processors/exif-metadata"
		);

		const file = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const result = await parseExifData(file);

		expect(result.raw).toBe(rawData);
	});
});
