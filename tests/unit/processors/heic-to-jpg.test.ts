import { describe, expect, it, vi } from "vitest";

// Mock heic2any since it requires browser APIs
vi.mock("heic2any", () => ({
	default: vi.fn(),
}));

import heic2any from "heic2any";
import { heicToJpg } from "~/features/image-tools/processors/heic-to-jpg";

const mockedHeic2any = vi.mocked(heic2any);

describe("heicToJpg processor", () => {
	it("should convert a blob and return a single Blob", async () => {
		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob = new Blob(["fake-jpg-data"], { type: "image/jpeg" });

		mockedHeic2any.mockResolvedValue(outputBlob);

		const result = await heicToJpg(inputBlob, { quality: 0.92 });

		expect(result).toBeInstanceOf(Blob);
		expect(mockedHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/jpeg",
			quality: 0.92,
		});
	});

	it("should return the first blob when heic2any returns an array", async () => {
		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		const outputBlob1 = new Blob(["jpg-1"], { type: "image/jpeg" });
		const outputBlob2 = new Blob(["jpg-2"], { type: "image/jpeg" });

		// biome-ignore lint/suspicious/noExplicitAny: heic2any returns Blob | Blob[], mock needs cast
		mockedHeic2any.mockResolvedValue([outputBlob1, outputBlob2] as any);

		const result = await heicToJpg(inputBlob);

		expect(result).toBe(outputBlob1);
	});

	it("should use default quality of 0.92 when no options provided", async () => {
		const inputBlob = new Blob(["fake-heic-data"], { type: "image/heic" });
		mockedHeic2any.mockResolvedValue(new Blob());

		await heicToJpg(inputBlob);

		expect(mockedHeic2any).toHaveBeenCalledWith({
			blob: inputBlob,
			toType: "image/jpeg",
			quality: 0.92,
		});
	});

	it("should propagate errors from heic2any", async () => {
		const inputBlob = new Blob(["bad-data"]);
		mockedHeic2any.mockRejectedValue(new Error("Invalid HEIC file"));

		await expect(heicToJpg(inputBlob)).rejects.toThrow("Invalid HEIC file");
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

		mockedHeic2any
			.mockResolvedValueOnce(output1)
			.mockResolvedValueOnce(output2);

		const results = await heicToJpgBatch([input1, input2], { quality: 0.85 });

		expect(results).toHaveLength(2);
		expect(results[0]).toBe(output1);
		expect(results[1]).toBe(output2);
	});

	it("should call onProgress with file index", async () => {
		const { heicToJpgBatch } = await import(
			"~/features/image-tools/processors/heic-to-jpg"
		);

		const input1 = new Blob(["heic-1"], { type: "image/heic" });
		const input2 = new Blob(["heic-2"], { type: "image/heic" });

		mockedHeic2any
			.mockResolvedValueOnce(new Blob(["jpg-1"]))
			.mockResolvedValueOnce(new Blob(["jpg-2"]));

		const onProgress = vi.fn();
		await heicToJpgBatch([input1, input2], { quality: 0.92 }, onProgress);

		// Should be called with (completedIndex, totalCount)
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

		mockedHeic2any
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
