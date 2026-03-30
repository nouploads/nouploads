import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Helper: build a minimal synthetic EMF binary                      */
/* ------------------------------------------------------------------ */

/**
 * Build a minimal EMF with: EMR_HEADER + optional body records + EMR_EOF.
 * Canvas bounds: (0,0)-(width,height).
 */
function makeEmf(
	width: number,
	height: number,
	bodyRecords: Uint8Array[] = [],
): Uint8Array {
	// EMR_HEADER: 88 bytes minimum
	const headerSize = 88;
	const header = new ArrayBuffer(headerSize);
	const hv = new DataView(header);

	// Record type = 1 (EMR_HEADER)
	hv.setUint32(0, 0x0001, true);
	// Record size
	hv.setUint32(4, headerSize, true);
	// Bounds RECTL: left=0, top=0, right=width, bottom=height
	hv.setInt32(8, 0, true);
	hv.setInt32(12, 0, true);
	hv.setInt32(16, width, true);
	hv.setInt32(20, height, true);
	// Frame RECTL (0.01mm — not used when bounds are valid)
	hv.setInt32(24, 0, true);
	hv.setInt32(28, 0, true);
	hv.setInt32(32, width * 100, true);
	hv.setInt32(36, height * 100, true);
	// Signature " EMF" = 0x464D4520 LE
	hv.setUint32(40, 0x464d4520, true);
	// Version
	hv.setUint32(44, 0x00010000, true);
	// Bytes (filled later), nRecords (filled later)
	hv.setUint32(52, 2 + bodyRecords.length, true); // nRecords
	// nHandles, reserved
	hv.setUint16(56, 1, true);
	// nDescription, offDescription, nPalEntries — leave 0
	// Device dimensions (pixels)
	hv.setInt32(72, 1920, true);
	hv.setInt32(76, 1080, true);
	// Device dimensions (mm)
	hv.setInt32(80, 508, true);
	hv.setInt32(84, 285, true);

	// EMR_EOF: 20 bytes (type=14, size=20, nPalEntries=0, offPalEntries=0, sizeLast=20)
	const eofBuf = new ArrayBuffer(20);
	const ev = new DataView(eofBuf);
	ev.setUint32(0, 0x000e, true); // EMR_EOF
	ev.setUint32(4, 20, true); // size
	ev.setUint32(16, 20, true); // sizeLast

	// Concatenate
	let totalSize = headerSize;
	for (const r of bodyRecords) totalSize += r.byteLength;
	totalSize += 20; // EOF

	// Update header: total bytes
	hv.setUint32(48, totalSize, true);

	const result = new Uint8Array(totalSize);
	result.set(new Uint8Array(header), 0);
	let off = headerSize;
	for (const r of bodyRecords) {
		result.set(r, off);
		off += r.byteLength;
	}
	result.set(new Uint8Array(eofBuf), off);

	return result;
}

/**
 * Build an EMR_RECTANGLE record.
 * Record type = 0x002B, size = 24 bytes.
 * RECTL: left, top, right, bottom (4 x int32).
 */
function makeRectangleRecord(
	left: number,
	top: number,
	right: number,
	bottom: number,
): Uint8Array {
	const buf = new ArrayBuffer(24);
	const v = new DataView(buf);
	v.setUint32(0, 0x002b, true); // EMR_RECTANGLE
	v.setUint32(4, 24, true); // size
	v.setInt32(8, left, true);
	v.setInt32(12, top, true);
	v.setInt32(16, right, true);
	v.setInt32(20, bottom, true);
	return new Uint8Array(buf);
}

/* ------------------------------------------------------------------ */
/*  Canvas mock for jsdom (no real canvas in unit tests)              */
/* ------------------------------------------------------------------ */

/**
 * Create a mock CanvasRenderingContext2D that tracks calls.
 * Returns pixel data as a white background (255,255,255,255).
 */
function createMockCanvas() {
	const calls: { method: string; args: unknown[] }[] = [];

	const mockCtx = {
		fillStyle: "",
		strokeStyle: "",
		lineWidth: 1,
		fillRect: vi.fn((...args: unknown[]) =>
			calls.push({ method: "fillRect", args }),
		),
		strokeRect: vi.fn((...args: unknown[]) =>
			calls.push({ method: "strokeRect", args }),
		),
		beginPath: vi.fn(() => calls.push({ method: "beginPath", args: [] })),
		moveTo: vi.fn((...args: unknown[]) =>
			calls.push({ method: "moveTo", args }),
		),
		lineTo: vi.fn((...args: unknown[]) =>
			calls.push({ method: "lineTo", args }),
		),
		closePath: vi.fn(() => calls.push({ method: "closePath", args: [] })),
		stroke: vi.fn((...args: unknown[]) =>
			calls.push({ method: "stroke", args }),
		),
		fill: vi.fn((...args: unknown[]) => calls.push({ method: "fill", args })),
		ellipse: vi.fn((...args: unknown[]) =>
			calls.push({ method: "ellipse", args }),
		),
		translate: vi.fn((...args: unknown[]) =>
			calls.push({ method: "translate", args }),
		),
		putImageData: vi.fn((...args: unknown[]) =>
			calls.push({ method: "putImageData", args }),
		),
		drawImage: vi.fn((...args: unknown[]) =>
			calls.push({ method: "drawImage", args }),
		),
		getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
			// Return white pixels
			const data = new Uint8ClampedArray(w * h * 4);
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255;
				data[i + 1] = 255;
				data[i + 2] = 255;
				data[i + 3] = 255;
			}
			return { data, width: w, height: h };
		}),
	};

	return { mockCtx, calls };
}

/**
 * Install the canvas mock on document.createElement.
 */
function installCanvasMock() {
	const { mockCtx, calls } = createMockCanvas();
	const originalCreateElement = document.createElement.bind(document);

	vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		if (tag === "canvas") {
			const canvas = originalCreateElement("canvas");
			// Override getContext to return our mock
			canvas.getContext = (() =>
				mockCtx) as unknown as typeof canvas.getContext;
			return canvas;
		}
		return originalCreateElement(tag);
	});

	return { mockCtx, calls };
}

describe("decodeEmf", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should decode a minimal EMF with a rectangle to correct dimensions", async () => {
		const { mockCtx, calls } = installCanvasMock();
		const rect = makeRectangleRecord(0, 0, 4, 4);
		const emf = makeEmf(4, 4, [rect]);
		const blob = new Blob([emf as BlobPart], { type: "image/x-emf" });

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);
		const result = await decodeEmf(blob);

		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(result.data.length).toBe(4 * 4 * 4);

		// Should have called fillRect for the white background
		expect(mockCtx.fillRect).toHaveBeenCalled();

		// Should have drawn a rectangle (fillRect for fill + strokeRect for stroke)
		const rectCalls = calls.filter(
			(c) => c.method === "fillRect" || c.method === "strokeRect",
		);
		expect(rectCalls.length).toBeGreaterThanOrEqual(2); // bg + shape
	});

	it("should decode a header-only EMF with correct dimensions", async () => {
		installCanvasMock();
		const emf = makeEmf(8, 6);
		const blob = new Blob([emf as BlobPart], { type: "image/x-emf" });

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);
		const result = await decodeEmf(blob);

		expect(result.width).toBe(8);
		expect(result.height).toBe(6);
		expect(result.data.length).toBe(8 * 6 * 4);
	});

	it("should reject corrupt data (too short)", async () => {
		const blob = new Blob([new Uint8Array(10) as BlobPart], {
			type: "image/x-emf",
		});

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);

		await expect(decodeEmf(blob)).rejects.toThrow("The header is too short");
	});

	it("should reject data with invalid EMF signature", async () => {
		const emf = makeEmf(4, 4);
		// Signature is at offset 40-43; zero it out
		emf[40] = 0;
		emf[41] = 0;
		emf[42] = 0;
		emf[43] = 0;
		const blob = new Blob([emf as BlobPart], { type: "image/x-emf" });

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);

		await expect(decodeEmf(blob)).rejects.toThrow("Invalid EMF signature");
	});

	it("should reject data with missing EMR_HEADER record type", async () => {
		const buf = new Uint8Array(88);
		const v = new DataView(buf.buffer);
		v.setUint32(0, 0x0099, true); // wrong type
		const blob = new Blob([buf as BlobPart], { type: "image/x-emf" });

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);

		await expect(decodeEmf(blob)).rejects.toThrow("Missing EMR_HEADER");
	});

	it("should respect abort signal (pre-aborted)", async () => {
		const emf = makeEmf(4, 4);
		const blob = new Blob([emf as BlobPart], { type: "image/x-emf" });
		const controller = new AbortController();
		controller.abort();

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);

		await expect(decodeEmf(blob, controller.signal)).rejects.toThrow("Aborted");
	});

	it("should handle degenerate bounds by falling back to frame dimensions", async () => {
		installCanvasMock();

		// Build EMF with zero bounds but valid frame
		const headerSize = 88;
		const header = new ArrayBuffer(headerSize);
		const hv = new DataView(header);

		hv.setUint32(0, 0x0001, true);
		hv.setUint32(4, headerSize, true);
		// Bounds: all zeros (degenerate)
		hv.setInt32(8, 0, true);
		hv.setInt32(12, 0, true);
		hv.setInt32(16, 0, true);
		hv.setInt32(20, 0, true);
		// Frame: 0,0 to 50800,25400 (0.01mm units -> 508mm x 254mm)
		hv.setInt32(24, 0, true);
		hv.setInt32(28, 0, true);
		hv.setInt32(32, 50800, true);
		hv.setInt32(36, 25400, true);
		// Signature
		hv.setUint32(40, 0x464d4520, true);
		hv.setUint32(44, 0x00010000, true);
		hv.setUint32(48, headerSize + 20, true);
		hv.setUint32(52, 2, true);
		hv.setUint16(56, 1, true);
		// Device: 1920x1080 pixels, 508x285 mm
		hv.setInt32(72, 1920, true);
		hv.setInt32(76, 1080, true);
		hv.setInt32(80, 508, true);
		hv.setInt32(84, 285, true);

		// EOF record
		const eofBuf = new ArrayBuffer(20);
		const ev = new DataView(eofBuf);
		ev.setUint32(0, 0x000e, true);
		ev.setUint32(4, 20, true);
		ev.setUint32(16, 20, true);

		const emf = new Uint8Array(headerSize + 20);
		emf.set(new Uint8Array(header), 0);
		emf.set(new Uint8Array(eofBuf), headerSize);

		const blob = new Blob([emf as BlobPart], { type: "image/x-emf" });

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);
		const result = await decodeEmf(blob);

		// Should have calculated positive dimensions from the frame
		expect(result.width).toBeGreaterThan(0);
		expect(result.height).toBeGreaterThan(0);
		expect(result.data.length).toBe(result.width * result.height * 4);
	});

	it("should reject EMF with out-of-range dimensions", async () => {
		installCanvasMock();

		const headerSize = 88;
		const header = new ArrayBuffer(headerSize);
		const hv = new DataView(header);

		hv.setUint32(0, 0x0001, true);
		hv.setUint32(4, headerSize, true);
		// Bounds: huge dimensions
		hv.setInt32(8, 0, true);
		hv.setInt32(12, 0, true);
		hv.setInt32(16, 99999, true);
		hv.setInt32(20, 99999, true);
		hv.setUint32(40, 0x464d4520, true);

		const blob = new Blob([new Uint8Array(header)], { type: "image/x-emf" });

		const { decodeEmf } = await import(
			"~/features/image-tools/decoders/decode-emf"
		);

		await expect(decodeEmf(blob)).rejects.toThrow("outside supported range");
	});
});
