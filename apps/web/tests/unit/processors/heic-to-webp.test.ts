import { afterEach, describe, expect, it, vi } from "vitest";

const mockHeic2any = vi.fn();

vi.mock("heic2any", () => ({
	default: mockHeic2any,
}));

afterEach(() => {
	vi.restoreAllMocks();
	mockHeic2any.mockReset();
});

describe("heicToWebp processor", () => {
	it("should call heic2any with image/webp and quality", async () => {
		const { heicToWebp } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-webp-data"], { type: "image/webp" });
		mockHeic2any.mockResolvedValue(outputBlob);

		const result = await heicToWebp(inputBlob, { quality: 0.82 });

		expect(mockHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/webp",
			quality: 0.82,
		});
		expect(result).toBe(outputBlob);
	});

	it("should use default quality of 0.82 when no options provided", async () => {
		const { heicToWebp } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		mockHeic2any.mockResolvedValue(new Blob());

		await heicToWebp(inputBlob);

		expect(mockHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/webp",
			quality: 0.82,
		});
	});

	it("should propagate errors from heic2any", async () => {
		const { heicToWebp } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const inputBlob = new Blob(["bad-data"]);
		mockHeic2any.mockRejectedValue(new Error("Invalid HEIC file"));

		await expect(heicToWebp(inputBlob)).rejects.toThrow("Invalid HEIC file");
	});

	it("should reject immediately if signal already aborted", async () => {
		const { heicToWebp } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const controller = new AbortController();
		controller.abort();

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });

		await expect(
			heicToWebp(inputBlob, { quality: 0.82, signal: controller.signal }),
		).rejects.toThrow();
		expect(mockHeic2any).not.toHaveBeenCalled();
	});

	it("should handle array result from heic2any", async () => {
		const { heicToWebp } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-webp-data"], { type: "image/webp" });
		mockHeic2any.mockResolvedValue([outputBlob]);

		const result = await heicToWebp(inputBlob, { quality: 0.75 });
		expect(result).toBe(outputBlob);
	});
});

describe("heicToWebpBatch processor", () => {
	it("should convert multiple blobs and return results array", async () => {
		const { heicToWebpBatch } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["heic-2"], { type: "image/heic" });
		const output1 = new Blob(["webp-1"], { type: "image/webp" });
		const output2 = new Blob(["webp-2"], { type: "image/webp" });

		mockHeic2any.mockResolvedValueOnce(output1).mockResolvedValueOnce(output2);

		const results = await heicToWebpBatch([input1, input2], { quality: 0.8 });
		expect(results).toHaveLength(2);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBe(output2);
	});

	it("should return partial results and errors for failed files", async () => {
		const { heicToWebpBatch } = await import(
			"~/features/image-tools/processors/heic-to-webp"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["bad-data"], { type: "image/heic" });
		const output1 = new Blob(["webp-1"], { type: "image/webp" });

		mockHeic2any
			.mockResolvedValueOnce(output1)
			.mockRejectedValueOnce(new Error("Invalid HEIC file"));

		const results = await heicToWebpBatch([input1, input2], { quality: 0.82 });
		expect(results).toHaveLength(2);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBeInstanceOf(Error);
	});
});
