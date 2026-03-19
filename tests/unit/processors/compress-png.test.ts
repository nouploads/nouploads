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

describe("compressPng processor", () => {
	it("should post blob and colors to worker and return result", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const output = new Blob(["smaller"], { type: "image/png" });

		const promise = compressPng(input, { colors: 128 });

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			colors: 128,
		});

		worker.simulateMessage({ blob: output, width: 800, height: 600 });

		const result = await promise;
		expect(result.blob).toBe(output);
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should use default 256 colors when no options provided", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input = new Blob(["fake-png"], { type: "image/png" });
		const promise = compressPng(input);

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			colors: 256,
		});

		worker.simulateMessage({ blob: new Blob(), width: 100, height: 100 });
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input = new Blob(["bad"], { type: "image/png" });
		const promise = compressPng(input);

		getLastInstance().simulateMessage({
			error: "Image dimensions 20000×100 exceed the maximum of 16384px",
		});

		await expect(promise).rejects.toThrow(/exceed.*maximum/i);
	});

	it("should terminate worker on abort signal", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const controller = new AbortController();
		const input = new Blob(["fake-png"], { type: "image/png" });

		const promise = compressPng(input, {
			colors: 128,
			signal: controller.signal,
		});

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal already aborted", async () => {
		const { compressPng } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const controller = new AbortController();
		controller.abort();

		await expect(
			compressPng(new Blob(), { colors: 128, signal: controller.signal }),
		).rejects.toThrow();
	});
});

describe("compressPngBatch processor", () => {
	it("should process multiple files and return results", async () => {
		const { compressPngBatch } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input1 = new Blob(["img-1"], { type: "image/png" });
		const input2 = new Blob(["img-2"], { type: "image/png" });
		const output1 = new Blob(["out-1"], { type: "image/png" });
		const output2 = new Blob(["out-2"], { type: "image/png" });

		const promise = compressPngBatch([input1, input2], { colors: 128 });

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
		const { compressPngBatch } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input1 = new Blob(["img-1"], { type: "image/png" });
		const input2 = new Blob(["bad"], { type: "image/png" });
		const input3 = new Blob(["img-3"], { type: "image/png" });

		const promise = compressPngBatch([input1, input2, input3], {
			colors: 256,
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
		const { compressPngBatch } = await import(
			"~/features/image-tools/processors/compress-png"
		);

		const input1 = new Blob(["img-1"], { type: "image/png" });
		const input2 = new Blob(["img-2"], { type: "image/png" });
		const onProgress = vi.fn();

		const promise = compressPngBatch(
			[input1, input2],
			{ colors: 256 },
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
