import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function mockPdfResponse() {
	return {
		output: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
		extension: ".pdf",
		mimeType: "application/pdf",
		metadata: { pageCount: 1, inputCount: 1 },
	};
}

describe("imagesToPdf processor", () => {
	it("should dispatch multi-input pipeline request with default fit size", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File(
			[new Uint8Array([0xff, 0xd8, 0xff])],
			"photo.jpg",
			{
				type: "image/jpeg",
			},
		);

		const promise = imagesToPdf([jpgFile]);
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "images-to-pdf",
				inputs: [expect.any(Uint8Array)],
				options: { pageSize: "fit" },
			}),
		);

		worker.simulateMessage(mockPdfResponse());
		const result = await promise;
		expect(result).toBeInstanceOf(Blob);
		expect(result.type).toBe("application/pdf");
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should pass a4 page size when specified", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		const promise = imagesToPdf([jpgFile], { pageSize: "a4" });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				options: { pageSize: "a4" },
			}),
		);

		worker.simulateMessage(mockPdfResponse());
		await promise;
	});

	it("should pass letter page size when specified", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		const promise = imagesToPdf([jpgFile], { pageSize: "letter" });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				options: { pageSize: "letter" },
			}),
		);

		worker.simulateMessage(mockPdfResponse());
		await promise;
	});

	it("should pass multiple images as multi-input array and report end progress", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const file1 = new File([new Uint8Array(10)], "photo1.jpg", {
			type: "image/jpeg",
		});
		const file2 = new File([new Uint8Array(10)], "photo2.png", {
			type: "image/png",
		});
		const onProgress = vi.fn();

		const promise = imagesToPdf([file1, file2], undefined, onProgress);
		await tick();
		await tick();

		const worker = getLastInstance();
		const call = worker.postMessage.mock.calls[0][0] as {
			inputs: Uint8Array[];
		};
		expect(call.inputs).toHaveLength(2);

		worker.simulateMessage(mockPdfResponse());
		await promise;

		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(2, 2);
	});

	it("should throw when no images provided", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		await expect(imagesToPdf([])).rejects.toThrow("No images provided");
	});

	it("should reject immediately if signal already aborted", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const controller = new AbortController();
		controller.abort();

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});

		await expect(
			imagesToPdf([jpgFile], { signal: controller.signal }),
		).rejects.toThrow();
	});

	it("should propagate errors from worker", async () => {
		const { imagesToPdf } = await import(
			"~/features/image-tools/processors/image-to-pdf"
		);

		const jpgFile = new File([new Uint8Array(10)], "photo.jpg", {
			type: "image/jpeg",
		});
		const promise = imagesToPdf([jpgFile]);
		await tick();
		await tick();

		getLastInstance().simulateMessage({ error: "pdf-lib failed" });
		await expect(promise).rejects.toThrow(/pdf-lib failed/);
	});
});
