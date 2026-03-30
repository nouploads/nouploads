import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockWorkerClass } from "../helpers/mock-worker";

const { MockWorker, getLastInstance } = createMockWorkerClass();

/** Wait for microtask queue to flush so async worker creation completes */
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
	vi.stubGlobal("Worker", MockWorker);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("packIco", () => {
	it("should produce valid ICO header bytes (00 00 01 00)", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		// Minimal fake PNG data (just enough to test packing)
		const fakePng16 = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);
		const fakePng32 = new Uint8Array([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);

		const ico = packIco([fakePng16, fakePng32], [16, 32]);

		// ICO magic bytes: 00 00 01 00
		expect(ico[0]).toBe(0x00);
		expect(ico[1]).toBe(0x00);
		expect(ico[2]).toBe(0x01);
		expect(ico[3]).toBe(0x00);
	});

	it("should encode image count correctly", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

		const ico2 = packIco([fakePng, fakePng], [16, 32]);
		const view2 = new DataView(ico2.buffer);
		expect(view2.getUint16(4, true)).toBe(2);

		const ico3 = packIco([fakePng, fakePng, fakePng], [16, 32, 48]);
		const view3 = new DataView(ico3.buffer);
		expect(view3.getUint16(4, true)).toBe(3);
	});

	it("should encode directory entries with correct sizes", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

		const ico = packIco([fakePng, fakePng, fakePng], [16, 32, 48]);

		// First entry: width=16, height=16
		expect(ico[6]).toBe(16);
		expect(ico[7]).toBe(16);

		// Second entry: width=32, height=32
		expect(ico[22]).toBe(32);
		expect(ico[23]).toBe(32);

		// Third entry: width=48, height=48
		expect(ico[38]).toBe(48);
		expect(ico[39]).toBe(48);
	});

	it("should encode bits per pixel as 32", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		const ico = packIco([fakePng], [16]);
		const view = new DataView(ico.buffer);

		// Directory entry bits per pixel at offset 6+6 = 12
		expect(view.getUint16(12, true)).toBe(32);
	});

	it("should embed PNG data at correct offsets", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const png1 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0xaa]);
		const png2 = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0xbb, 0xcc]);

		const ico = packIco([png1, png2], [16, 32]);
		const view = new DataView(ico.buffer);

		// First image offset: header(6) + 2*dirEntry(32) = 38
		const offset1 = view.getUint32(18, true); // dirEntry1 offset at 6+12
		expect(offset1).toBe(38);

		// First image size
		const size1 = view.getUint32(14, true); // dirEntry1 size at 6+8
		expect(size1).toBe(5);

		// Verify first PNG data
		expect(ico[offset1]).toBe(0x89);
		expect(ico[offset1 + 4]).toBe(0xaa);

		// Second image offset
		const offset2 = view.getUint32(34, true); // dirEntry2 offset at 22+12
		expect(offset2).toBe(43); // 38 + 5

		// Verify second PNG data
		expect(ico[offset2]).toBe(0x89);
		expect(ico[offset2 + 4]).toBe(0xbb);
		expect(ico[offset2 + 5]).toBe(0xcc);
	});

	it("should calculate total size correctly", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const png1 = new Uint8Array(100);
		const png2 = new Uint8Array(200);
		const png3 = new Uint8Array(300);

		const ico = packIco([png1, png2, png3], [16, 32, 48]);

		// header(6) + 3*dirEntry(48) + data(100+200+300) = 654
		expect(ico.length).toBe(654);
	});

	it("should throw if pngBuffers and sizes have different lengths", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		expect(() => packIco([new Uint8Array(1)], [16, 32])).toThrow(/same length/);
	});

	it("should throw if no PNG buffers provided", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		expect(() => packIco([], [])).toThrow(/At least one/);
	});

	it("should encode 256px size as 0 in directory entry", async () => {
		const { packIco } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const fakePng = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		const ico = packIco([fakePng], [256]);

		// Width and height should be 0 (meaning 256)
		expect(ico[6]).toBe(0);
		expect(ico[7]).toBe(0);
	});
});

describe("generateFavicon processor", () => {
	it("should post blob and sizes to worker", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake-image"], "logo.png", {
			type: "image/png",
		});

		const icoBlob = new Blob(["ico-data"], { type: "image/x-icon" });
		const sizeResults = [
			{ size: 16, pngBlob: new Blob(["png16"]) },
			{ size: 32, pngBlob: new Blob(["png32"]) },
			{ size: 48, pngBlob: new Blob(["png48"]) },
		];

		const promise = generateFavicon(input, { sizes: [16, 32, 48] });
		await tick();

		const worker = getLastInstance();
		expect(worker).not.toBeNull();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			sizes: [16, 32, 48],
		});

		worker.simulateMessage({ icoBlob, sizes: sizeResults });

		const result = await promise;
		expect(result.icoBlob).toBe(icoBlob);
		expect(result.sizes).toHaveLength(3);
		expect(result.sizes[0].size).toBe(16);
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should use default sizes when not specified", async () => {
		const { generateFavicon, DEFAULT_SIZES } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake"], "test.jpg", { type: "image/jpeg" });

		const promise = generateFavicon(input);
		await tick();

		const worker = getLastInstance();
		expect(worker.postMessage).toHaveBeenCalledWith({
			blob: input,
			sizes: DEFAULT_SIZES,
		});

		worker.simulateMessage({
			icoBlob: new Blob(),
			sizes: DEFAULT_SIZES.map((s) => ({ size: s, pngBlob: new Blob() })),
		});
		await promise;
	});

	it("should propagate errors from worker", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const input = new File(["fake"], "bad.jpg", { type: "image/jpeg" });
		const promise = generateFavicon(input);
		await tick();

		getLastInstance().simulateMessage({
			error: "Could not get OffscreenCanvas 2D context",
		});

		await expect(promise).rejects.toThrow(/OffscreenCanvas/);
	});

	it("should terminate worker on abort signal", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const controller = new AbortController();
		const input = new File(["fake"], "test.png", { type: "image/png" });

		const promise = generateFavicon(input, {
			signal: controller.signal,
		});
		await tick();

		const worker = getLastInstance();
		controller.abort();

		await expect(promise).rejects.toThrow();
		expect(worker.terminate).toHaveBeenCalled();
	});

	it("should reject immediately if signal is already aborted", async () => {
		const { generateFavicon } = await import(
			"~/features/image-tools/processors/favicon-generator"
		);

		const controller = new AbortController();
		controller.abort();

		const input = new File(["fake"], "test.png", { type: "image/png" });
		const promise = generateFavicon(input, {
			signal: controller.signal,
		});

		await expect(promise).rejects.toThrow(/Aborted/);
	});
});
