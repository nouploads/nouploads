import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockHeic2any = vi.fn();

vi.mock("heic2any", () => ({
	default: mockHeic2any,
}));

afterEach(() => {
	vi.restoreAllMocks();
	mockHeic2any.mockReset();
});

describe("heicToJpg processor", () => {
	it("should call heic2any with correct parameters and return result", async () => {
		const { heicToJpg } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-jpg-data"], { type: "image/jpeg" });
		mockHeic2any.mockResolvedValue(outputBlob);

		const result = await heicToJpg(inputBlob, { quality: 0.92 });

		expect(mockHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/jpeg",
			quality: 0.92,
		});
		expect(result).toBe(outputBlob);
	});

	it("should use default quality of 0.92 when no options provided", async () => {
		const { heicToJpg } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		mockHeic2any.mockResolvedValue(new Blob());

		await heicToJpg(inputBlob);

		expect(mockHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/jpeg",
			quality: 0.92,
		});
	});

	it("should propagate errors from heic2any", async () => {
		const { heicToJpg } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const inputBlob = new Blob(["bad-data"]);
		mockHeic2any.mockRejectedValue(new Error("Invalid HEIC file"));

		await expect(heicToJpg(inputBlob)).rejects.toThrow("Invalid HEIC file");
	});

	it("should reject immediately if signal already aborted", async () => {
		const { heicToJpg } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const controller = new AbortController();
		controller.abort();

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });

		await expect(
			heicToJpg(inputBlob, { quality: 0.92, signal: controller.signal }),
		).rejects.toThrow();
		// heic2any should not even be called
		expect(mockHeic2any).not.toHaveBeenCalled();
	});

	it("should handle array result from heic2any", async () => {
		const { heicToJpg } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-jpg-data"], { type: "image/jpeg" });
		mockHeic2any.mockResolvedValue([outputBlob]);

		const result = await heicToJpg(inputBlob, { quality: 0.85 });
		expect(result).toBe(outputBlob);
	});
});

describe("heicToJpgBatch processor", () => {
	it("should convert multiple blobs and return results array", async () => {
		const { heicToJpgBatch } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["heic-2"], { type: "image/heic" });
		const output1 = new Blob(["jpg-1"], { type: "image/jpeg" });
		const output2 = new Blob(["jpg-2"], { type: "image/jpeg" });

		mockHeic2any.mockResolvedValueOnce(output1).mockResolvedValueOnce(output2);

		const results = await heicToJpgBatch([input1, input2], { quality: 0.85 });
		expect(results).toHaveLength(2);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBe(output2);
	});

	it("should call onProgress for each file", async () => {
		const { heicToJpgBatch } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["heic-2"], { type: "image/heic" });
		const onProgress = vi.fn();

		mockHeic2any
			.mockResolvedValueOnce(new Blob())
			.mockResolvedValueOnce(new Blob());

		await heicToJpgBatch([input1, input2], { quality: 0.92 }, onProgress);
		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
	});

	it("should return partial results and errors for failed files", async () => {
		const { heicToJpgBatch } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["bad-data"], { type: "image/heic" });
		const input3 = new Blob(["heic-3"], { type: "image/heic" });
		const output1 = new Blob(["jpg-1"], { type: "image/jpeg" });
		const output3 = new Blob(["jpg-3"], { type: "image/jpeg" });

		mockHeic2any
			.mockResolvedValueOnce(output1)
			.mockRejectedValueOnce(new Error("Invalid HEIC file"))
			.mockResolvedValueOnce(output3);

		const results = await heicToJpgBatch([input1, input2, input3], {
			quality: 0.92,
		});
		expect(results).toHaveLength(3);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBeInstanceOf(Error);
		expect((results[1] as Error).message).toBe("Invalid HEIC file");
		expect(results[2]).toBe(output3);
	});
});
