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

function mockResponse(mime: string, extension: string) {
	return {
		output: new Uint8Array([1, 2, 3, 4]),
		extension,
		mimeType: mime,
		metadata: { width: 800, height: 600 },
	};
}

describe("compressImage processor", () => {
	it("should dispatch to compress-jpg when outputFormat is image/jpeg", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake-jpg"], { type: "image/jpeg" });
		const promise = compressImage(input, { quality: 0.8 });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "compress-jpg",
				options: { quality: 80 },
			}),
		);

		worker.simulateMessage(mockResponse("image/jpeg", ".jpg"));
		const result = await promise;
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.type).toBe("image/jpeg");
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should dispatch to compress-webp when input is webp and outputFormat=same", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake"], { type: "image/webp" });
		const promise = compressImage(input, { quality: 0.7 });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "compress-webp",
				options: { quality: 70 },
			}),
		);

		worker.simulateMessage(mockResponse("image/webp", ".webp"));
		await promise;
	});

	it("should dispatch to compress-png when input is png and outputFormat=same", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake"], { type: "image/png" });
		const promise = compressImage(input);
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "compress-png",
				options: { colors: 256 },
			}),
		);

		worker.simulateMessage(mockResponse("image/png", ".png"));
		await promise;
	});

	it("should fall back to webp for unknown input mime with outputFormat=same", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake"], { type: "image/avif" });
		const promise = compressImage(input, { quality: 0.9 });
		await tick();
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				toolId: "compress-webp",
				options: { quality: 90 },
			}),
		);

		worker.simulateMessage(mockResponse("image/webp", ".webp"));
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["bad"], { type: "image/jpeg" });
		const promise = compressImage(input);
		await tick();
		await tick();

		getLastInstance().simulateMessage({
			error: "Corrupt image",
		});

		await expect(promise).rejects.toThrow(/Corrupt/);
	});

	it("should terminate worker on abort signal", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const controller = new AbortController();
		const input = new Blob(["fake-jpg"], { type: "image/jpeg" });
		const promise = compressImage(input, {
			quality: 0.8,
			signal: controller.signal,
		});
		await tick();
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const controller = new AbortController();
		controller.abort();

		await expect(
			compressImage(new Blob([], { type: "image/jpeg" }), {
				quality: 0.8,
				signal: controller.signal,
			}),
		).rejects.toThrow();
	});
});

describe("compressImageBatch processor", () => {
	it("should process multiple files and return results", async () => {
		const { compressImageBatch } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input1 = new Blob(["img-1"], { type: "image/jpeg" });
		const input2 = new Blob(["img-2"], { type: "image/jpeg" });

		const promise = compressImageBatch([input1, input2], { quality: 0.7 });

		for (let i = 0; i < 2; i++) {
			await tick();
			await tick();
			getLastInstance().simulateMessage(mockResponse("image/jpeg", ".jpg"));
		}

		const results = await promise;
		expect(results).toHaveLength(2);
		expect((results[0] as { blob: Blob }).blob).toBeInstanceOf(Blob);
		expect((results[1] as { blob: Blob }).blob).toBeInstanceOf(Blob);
	});

	it("should return Error for failed files without stopping batch", async () => {
		const { compressImageBatch } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const inputs = [
			new Blob(["img-1"], { type: "image/jpeg" }),
			new Blob(["bad"], { type: "image/jpeg" }),
			new Blob(["img-3"], { type: "image/jpeg" }),
		];

		const promise = compressImageBatch(inputs, { quality: 0.8 });

		await tick();
		await tick();
		getLastInstance().simulateMessage(mockResponse("image/jpeg", ".jpg"));
		await tick();
		await tick();
		getLastInstance().simulateMessage({ error: "Corrupt image" });
		await tick();
		await tick();
		getLastInstance().simulateMessage(mockResponse("image/jpeg", ".jpg"));

		const results = await promise;
		expect(results).toHaveLength(3);
		expect(results[0]).toHaveProperty("blob");
		expect(results[1]).toBeInstanceOf(Error);
		expect((results[1] as Error).message).toBe("Corrupt image");
		expect(results[2]).toHaveProperty("blob");
	});

	it("should call onProgress for each file", async () => {
		const { compressImageBatch } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const inputs = [
			new Blob(["img-1"], { type: "image/jpeg" }),
			new Blob(["img-2"], { type: "image/jpeg" }),
		];
		const onProgress = vi.fn();

		const promise = compressImageBatch(inputs, { quality: 0.8 }, onProgress);

		for (let i = 0; i < 2; i++) {
			await tick();
			await tick();
			getLastInstance().simulateMessage(mockResponse("image/jpeg", ".jpg"));
		}

		await promise;
		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
	});
});
