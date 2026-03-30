import { afterEach, describe, expect, it, vi } from "vitest";

const mockRemoveBackground = vi.fn();

vi.mock("@imgly/background-removal", () => ({
	removeBackground: mockRemoveBackground,
}));

afterEach(() => {
	vi.restoreAllMocks();
	mockRemoveBackground.mockReset();
});

describe("removeImageBackground processor", () => {
	it("should call removeBackground and return result with dimensions", async () => {
		const { removeImageBackground } = await import(
			"~/features/image-tools/processors/remove-background"
		);

		const inputFile = new File(["fake-image-data"], "photo.jpg", {
			type: "image/jpeg",
		});
		const outputBlob = new Blob(["fake-png-data"], { type: "image/png" });

		// Mock createImageBitmap for dimensions
		const mockBitmap = { width: 800, height: 600, close: vi.fn() };
		vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(mockBitmap));

		mockRemoveBackground.mockResolvedValue(outputBlob);

		const result = await removeImageBackground(inputFile);

		expect(mockRemoveBackground).toHaveBeenCalledWith(
			inputFile,
			expect.objectContaining({
				progress: expect.any(Function),
			}),
		);
		expect(result.blob).toBe(outputBlob);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(mockBitmap.close).toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { removeImageBackground } = await import(
			"~/features/image-tools/processors/remove-background"
		);

		const controller = new AbortController();
		controller.abort();

		const inputFile = new File(["fake-image-data"], "photo.jpg", {
			type: "image/jpeg",
		});

		await expect(
			removeImageBackground(inputFile, { signal: controller.signal }),
		).rejects.toThrow();
		expect(mockRemoveBackground).not.toHaveBeenCalled();
	});

	it("should call onProgress callback during inference", async () => {
		const { removeImageBackground } = await import(
			"~/features/image-tools/processors/remove-background"
		);

		const inputFile = new File(["fake-image-data"], "photo.jpg", {
			type: "image/jpeg",
		});
		const outputBlob = new Blob(["fake-png-data"], { type: "image/png" });

		const mockBitmap = { width: 400, height: 300, close: vi.fn() };
		vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(mockBitmap));

		mockRemoveBackground.mockImplementation(
			async (
				_input: File,
				opts: {
					progress: (key: string, current: number, total: number) => void;
				},
			) => {
				// Simulate progress callbacks
				opts.progress("fetch:model", 50, 100);
				opts.progress("compute:inference", 3, 10);
				opts.progress("compute:inference", 7, 10);
				opts.progress("compute:inference", 10, 10);
				return outputBlob;
			},
		);

		const onProgress = vi.fn();
		await removeImageBackground(inputFile, undefined, onProgress);

		// Should only report inference progress, not model download
		expect(onProgress).toHaveBeenCalledWith(30); // 3/10 * 100
		expect(onProgress).toHaveBeenCalledWith(70); // 7/10 * 100
		expect(onProgress).toHaveBeenCalledWith(100); // 10/10 * 100
	});

	it("should propagate errors from removeBackground", async () => {
		const { removeImageBackground } = await import(
			"~/features/image-tools/processors/remove-background"
		);

		const inputFile = new File(["bad-data"], "broken.jpg", {
			type: "image/jpeg",
		});

		const mockBitmap = { width: 100, height: 100, close: vi.fn() };
		vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(mockBitmap));

		mockRemoveBackground.mockRejectedValue(new Error("Model inference failed"));

		await expect(removeImageBackground(inputFile)).rejects.toThrow(
			"Model inference failed",
		);
	});

	it("should reject if signal is aborted after createImageBitmap", async () => {
		const { removeImageBackground } = await import(
			"~/features/image-tools/processors/remove-background"
		);

		const controller = new AbortController();
		const inputFile = new File(["fake-image-data"], "photo.jpg", {
			type: "image/jpeg",
		});

		const mockBitmap = { width: 800, height: 600, close: vi.fn() };
		vi.stubGlobal(
			"createImageBitmap",
			vi.fn().mockImplementation(async () => {
				controller.abort();
				return mockBitmap;
			}),
		);

		await expect(
			removeImageBackground(inputFile, { signal: controller.signal }),
		).rejects.toThrow();
		expect(mockRemoveBackground).not.toHaveBeenCalled();
	});
});
