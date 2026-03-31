import { afterEach, describe, expect, it, vi } from "vitest";

const mockHeic2any = vi.fn();

vi.mock("heic2any", () => ({
	default: mockHeic2any,
}));

afterEach(() => {
	vi.restoreAllMocks();
	mockHeic2any.mockReset();
});

describe("heicToPng processor", () => {
	it("should call heic2any with image/png and return result", async () => {
		const { heicToPng } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-png-data"], { type: "image/png" });
		mockHeic2any.mockResolvedValue(outputBlob);

		const result = await heicToPng(inputBlob);

		expect(mockHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/png",
		});
		expect(result).toBe(outputBlob);
	});

	it("should propagate errors from heic2any", async () => {
		const { heicToPng } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const inputBlob = new Blob(["bad-data"]);
		mockHeic2any.mockRejectedValue(new Error("Invalid HEIC file"));

		await expect(heicToPng(inputBlob)).rejects.toThrow("Invalid HEIC file");
	});

	it("should reject immediately if signal already aborted", async () => {
		const { heicToPng } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const controller = new AbortController();
		controller.abort();

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });

		await expect(
			heicToPng(inputBlob, { signal: controller.signal }),
		).rejects.toThrow();
		// heic2any should not even be called
		expect(mockHeic2any).not.toHaveBeenCalled();
	});

	it("should handle array result from heic2any", async () => {
		const { heicToPng } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-png-data"], { type: "image/png" });
		mockHeic2any.mockResolvedValue([outputBlob]);

		const result = await heicToPng(inputBlob);
		expect(result).toBe(outputBlob);
	});
});

describe("heicToPngBatch processor", () => {
	it("should convert multiple blobs and return results array", async () => {
		const { heicToPngBatch } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["heic-2"], { type: "image/heic" });
		const output1 = new Blob(["png-1"], { type: "image/png" });
		const output2 = new Blob(["png-2"], { type: "image/png" });

		mockHeic2any.mockResolvedValueOnce(output1).mockResolvedValueOnce(output2);

		const results = await heicToPngBatch([input1, input2]);
		expect(results).toHaveLength(2);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBe(output2);
	});

	it("should call onProgress for each file", async () => {
		const { heicToPngBatch } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["heic-2"], { type: "image/heic" });
		const onProgress = vi.fn();

		mockHeic2any
			.mockResolvedValueOnce(new Blob())
			.mockResolvedValueOnce(new Blob());

		await heicToPngBatch([input1, input2], {}, onProgress);
		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
	});

	it("should return partial results and errors for failed files", async () => {
		const { heicToPngBatch } = await import(
			"~/features/image-tools/processors/heic-to-png"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["bad-data"], { type: "image/heic" });
		const input3 = new Blob(["heic-3"], { type: "image/heic" });
		const output1 = new Blob(["png-1"], { type: "image/png" });
		const output3 = new Blob(["png-3"], { type: "image/png" });

		mockHeic2any
			.mockResolvedValueOnce(output1)
			.mockRejectedValueOnce(new Error("Invalid HEIC file"))
			.mockResolvedValueOnce(output3);

		const results = await heicToPngBatch([input1, input2, input3]);
		expect(results).toHaveLength(3);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBeInstanceOf(Error);
		expect((results[1] as Error).message).toBe("Invalid HEIC file");
		expect(results[2]).toBe(output3);
	});
});
