import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("compressImage processor", () => {
	it("should post blob and options to worker and return result", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake-jpg"], { type: "image/jpeg" });
		const output = new Blob(["smaller"], { type: "image/jpeg" });

		const promise = compressImage(input, { quality: 0.8 });

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			quality: 0.8,
			outputFormat: "same",
			inputMime: "image/jpeg",
		});

		worker.simulateMessage({ blob: output, width: 800, height: 600 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should use default quality of 0.8", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake-jpg"], { type: "image/jpeg" });
		const promise = compressImage(input);

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			quality: 0.8,
			outputFormat: "same",
			inputMime: "image/jpeg",
		});

		worker.simulateMessage({ blob: new Blob(), width: 100, height: 100 });
		await promise;
	});

	it("should pass explicit output format to worker", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const promise = compressImage(input, {
			quality: 0.7,
			outputFormat: "image/jpeg",
		});

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			quality: 0.7,
			outputFormat: "image/jpeg",
			inputMime: "image/png",
		});

		worker.simulateMessage({ blob: new Blob(), width: 100, height: 100 });
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { compressImage } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input = new Blob(["bad"]);
		const promise = compressImage(input);

		getLastInstance().simulateMessage({
			error: "Image dimensions 20000×100 exceed the maximum of 16384px",
		});

		await expect(promise).rejects.toThrow(/exceed.*maximum/i);
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
			compressImage(new Blob(), {
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
		const input2 = new Blob(["img-2"], { type: "image/png" });
		const output1 = new Blob(["out-1"], { type: "image/jpeg" });
		const output2 = new Blob(["out-2"], { type: "image/png" });

		const promise = compressImageBatch([input1, input2], { quality: 0.7 });

		getLastInstance().simulateMessage({
			blob: output1,
			width: 100,
			height: 100,
		});
		await new Promise((r) => setTimeout(r, 0));
		getLastInstance().simulateMessage({
			blob: output2,
			width: 100,
			height: 100,
		});

		const results = await promise;
		expect(results).toHaveLength(2);
		expect((results[0] as { blob: Blob }).blob).toBe(output1);
		expect((results[1] as { blob: Blob }).blob).toBe(output2);
	});

	it("should return Error for failed files without stopping batch", async () => {
		const { compressImageBatch } = await import(
			"~/features/image-tools/processors/compress-image"
		);

		const input1 = new Blob(["img-1"], { type: "image/jpeg" });
		const input2 = new Blob(["bad"], { type: "image/jpeg" });
		const input3 = new Blob(["img-3"], { type: "image/jpeg" });

		const promise = compressImageBatch([input1, input2, input3], {
			quality: 0.8,
		});

		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});
		await new Promise((r) => setTimeout(r, 0));
		getLastInstance().simulateMessage({ error: "Corrupt image" });
		await new Promise((r) => setTimeout(r, 0));
		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});

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

		const input1 = new Blob(["img-1"], { type: "image/jpeg" });
		const input2 = new Blob(["img-2"], { type: "image/jpeg" });
		const onProgress = vi.fn();

		const promise = compressImageBatch(
			[input1, input2],
			{ quality: 0.8 },
			onProgress,
		);

		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});
		await new Promise((r) => setTimeout(r, 0));
		getLastInstance().simulateMessage({
			blob: new Blob(),
			width: 100,
			height: 100,
		});

		await promise;
		expect(onProgress).toHaveBeenCalledWith(0, 2);
		expect(onProgress).toHaveBeenCalledWith(1, 2);
	});
});
