import type { DecodedImage } from "./types";

/**
 * Decode an XCF (GIMP native) file to raw RGBA pixels.
 *
 * Custom parser — no external library (uses fflate for zlib-compressed tiles).
 * Flattens all visible layers with Normal blend mode into a single composite.
 *
 * Handles:
 * - RGB, Grayscale, and Indexed base types
 * - Uncompressed, RLE, and zlib tile compression
 * - Layer opacity, visibility, and x/y offsets
 * - 64x64 tile-based storage
 */
export async function decodeXcf(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);

	// --- Header ---
	if (buffer.byteLength < 30) {
		throw new Error(
			"This XCF file could not be decoded. The file is too short.",
		);
	}

	// Magic: "gimp xcf " (9 bytes)
	const magic = String.fromCharCode(...bytes.subarray(0, 9));
	if (magic !== "gimp xcf ") {
		throw new Error("This XCF file could not be decoded. Invalid magic bytes.");
	}

	// Version string (null-terminated, up to 5 bytes: "file\0", "v001\0" .. "v014\0")
	let versionEnd = 9;
	while (
		versionEnd < Math.min(9 + 5, buffer.byteLength) &&
		bytes[versionEnd] !== 0
	) {
		versionEnd++;
	}
	const versionStr = String.fromCharCode(...bytes.subarray(9, versionEnd));
	// Determine if this is a 64-bit offset file (v011+)
	const use64 = isVersion64Bit(versionStr);

	let pos = versionEnd + 1; // skip null terminator

	const imgWidth = view.getUint32(pos, false);
	pos += 4;
	const imgHeight = view.getUint32(pos, false);
	pos += 4;
	const _baseType = view.getUint32(pos, false);
	pos += 4;

	if (imgWidth === 0 || imgHeight === 0) {
		throw new Error(
			"This XCF file could not be decoded. Image dimensions are zero.",
		);
	}

	if (imgWidth > 32768 || imgHeight > 32768) {
		throw new Error(
			"This XCF file is too large to decode in-browser (max 32768x32768).",
		);
	}

	// Skip precision field for v004+ (4 bytes)
	if (
		versionStr !== "file" &&
		versionStr !== "v001" &&
		versionStr !== "v002" &&
		versionStr !== "v003"
	) {
		pos += 4;
	}

	// --- Image properties ---
	let compression = 0; // 0=none, 1=RLE, 2=zlib
	let colormap: Uint8Array | null = null;
	let colormapColors = 0;

	pos = readProperties(view, bytes, pos, (type, payload, payloadOffset) => {
		if (type === 17 && payload >= 1) {
			// PROP_COMPRESSION
			compression = bytes[payloadOffset];
		} else if (type === 1 && payload >= 4) {
			// PROP_COLORMAP
			colormapColors = view.getUint32(payloadOffset, false);
			colormap = bytes.slice(
				payloadOffset + 4,
				payloadOffset + 4 + colormapColors * 3,
			);
		}
	});

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// Load fflate for zlib decompression if needed
	let inflateSync: ((data: Uint8Array) => Uint8Array) | null = null;
	if (compression === 2) {
		const fflate = await import("fflate");
		inflateSync = fflate.inflateSync;
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// --- Layer offsets ---
	const layerOffsets: number[] = [];
	while (pos < buffer.byteLength) {
		const offset = use64 ? readUint64(view, pos) : view.getUint32(pos, false);
		pos += use64 ? 8 : 4;
		if (offset === 0) break;
		layerOffsets.push(offset);
	}

	if (layerOffsets.length === 0) {
		throw new Error("This XCF file could not be decoded. No layers found.");
	}

	// --- Parse each layer ---
	interface LayerInfo {
		width: number;
		height: number;
		type: number;
		offsetX: number;
		offsetY: number;
		opacity: number;
		visible: boolean;
		mode: number;
		pixels: Uint8Array; // RGBA, layer-sized
	}

	const layers: LayerInfo[] = [];

	for (const layerPtr of layerOffsets) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		let lp = layerPtr;
		if (lp + 12 > buffer.byteLength) continue;

		const lw = view.getUint32(lp, false);
		lp += 4;
		const lh = view.getUint32(lp, false);
		lp += 4;
		const ltype = view.getUint32(lp, false);
		lp += 4;

		// Skip layer name (null-terminated string preceded by uint32 length)
		if (lp + 4 > buffer.byteLength) continue;
		const nameLen = view.getUint32(lp, false);
		lp += 4 + nameLen;

		// Layer properties
		let offsetX = 0;
		let offsetY = 0;
		let opacity = 255;
		let visible = true;
		let mode = 0;

		lp = readProperties(view, bytes, lp, (type, _payload, payloadOffset) => {
			if (type === 15 && payloadOffset + 8 <= buffer.byteLength) {
				// PROP_OFFSETS
				offsetX = view.getInt32(payloadOffset, false);
				offsetY = view.getInt32(payloadOffset, false);
				// Re-read correctly: two consecutive int32
				offsetX = view.getInt32(payloadOffset, false);
				offsetY = view.getInt32(payloadOffset + 4, false);
			} else if (type === 6 && payloadOffset + 4 <= buffer.byteLength) {
				// PROP_OPACITY
				opacity = view.getUint32(payloadOffset, false);
				if (opacity > 255) opacity = 255;
			} else if (type === 8 && payloadOffset + 4 <= buffer.byteLength) {
				// PROP_VISIBLE
				visible = view.getUint32(payloadOffset, false) !== 0;
			} else if (type === 7 && payloadOffset + 4 <= buffer.byteLength) {
				// PROP_MODE
				mode = view.getUint32(payloadOffset, false);
			}
		});

		if (!visible) continue;
		if (lw === 0 || lh === 0) continue;

		if (mode !== 0) {
			console.warn(
				`XCF layer uses blend mode ${mode} (not Normal). Compositing as Normal.`,
			);
		}

		// Read hierarchy pointer
		if (lp + (use64 ? 8 : 4) > buffer.byteLength) continue;
		const hierPtr = use64 ? readUint64(view, lp) : view.getUint32(lp, false);
		lp += use64 ? 8 : 4;
		// Skip mask pointer (we don't use it)

		// Parse hierarchy
		if (hierPtr === 0 || hierPtr + 12 > buffer.byteLength) continue;
		let hp = hierPtr;
		const _hierW = view.getUint32(hp, false);
		hp += 4;
		const _hierH = view.getUint32(hp, false);
		hp += 4;
		const bpp = view.getUint32(hp, false);
		hp += 4;

		// First level pointer
		if (hp + (use64 ? 8 : 4) > buffer.byteLength) continue;
		const levelPtr = use64 ? readUint64(view, hp) : view.getUint32(hp, false);
		if (levelPtr === 0 || levelPtr + 8 > buffer.byteLength) continue;

		// Parse level
		let lvlp = levelPtr;
		const _lvlW = view.getUint32(lvlp, false);
		lvlp += 4;
		const _lvlH = view.getUint32(lvlp, false);
		lvlp += 4;

		// Read tile offsets
		const tileOffsets: number[] = [];
		while (lvlp + (use64 ? 8 : 4) <= buffer.byteLength) {
			const tileOff = use64
				? readUint64(view, lvlp)
				: view.getUint32(lvlp, false);
			lvlp += use64 ? 8 : 4;
			if (tileOff === 0) break;
			tileOffsets.push(tileOff);
		}

		// Decode tiles into layer pixel buffer
		const layerPixels = new Uint8Array(lw * lh * bpp);
		const tilesPerRow = Math.ceil(lw / 64);
		const tilesPerCol = Math.ceil(lh / 64);

		for (
			let ti = 0;
			ti < tileOffsets.length && ti < tilesPerRow * tilesPerCol;
			ti++
		) {
			const tileCol = ti % tilesPerRow;
			const tileRow = Math.floor(ti / tilesPerRow);
			const tileX = tileCol * 64;
			const tileY = tileRow * 64;
			const tileW = Math.min(64, lw - tileX);
			const tileH = Math.min(64, lh - tileY);
			const tilePixels = tileW * tileH;

			// Get tile data bounds: from this offset to next offset (or end)
			const tileStart = tileOffsets[ti];
			const tileEnd =
				ti + 1 < tileOffsets.length ? tileOffsets[ti + 1] : buffer.byteLength;

			if (tileStart >= buffer.byteLength) continue;

			const tileRaw = bytes.subarray(
				tileStart,
				Math.min(tileEnd, buffer.byteLength),
			);

			let decoded: Uint8Array;
			if (compression === 0) {
				// Uncompressed: raw bytes, channel-interleaved per pixel
				decoded = tileRaw.slice(0, tilePixels * bpp);
			} else if (compression === 1) {
				// XCF RLE: per-channel RLE
				decoded = decodeXcfRle(tileRaw, tilePixels, bpp);
			} else if (compression === 2 && inflateSync) {
				// Zlib: inflate, then same channel-separated layout
				try {
					const inflated = inflateSync(tileRaw);
					decoded = inflated.slice(0, tilePixels * bpp);
				} catch {
					// Fall back to zeros on decompression failure
					decoded = new Uint8Array(tilePixels * bpp);
				}
			} else {
				decoded = new Uint8Array(tilePixels * bpp);
			}

			// Rearrange from channel-separated to interleaved and copy into layer buffer.
			// XCF stores tiles as: all bytes for channel 0, then all bytes for channel 1, etc.
			// For compression=0, data is already interleaved per-pixel.
			// For compression=1 and 2, data comes out channel-separated after RLE/inflate.
			const isChannelSeparated = compression !== 0;

			for (let py = 0; py < tileH; py++) {
				for (let px = 0; px < tileW; px++) {
					const pixIdx = py * tileW + px;
					const dstIdx = ((tileY + py) * lw + (tileX + px)) * bpp;

					if (isChannelSeparated) {
						for (let c = 0; c < bpp; c++) {
							layerPixels[dstIdx + c] = decoded[c * tilePixels + pixIdx];
						}
					} else {
						for (let c = 0; c < bpp; c++) {
							layerPixels[dstIdx + c] = decoded[pixIdx * bpp + c];
						}
					}
				}
			}
		}

		// Convert layer pixels to RGBA
		const layerRgba = new Uint8Array(lw * lh * 4);
		convertToRgba(
			layerPixels,
			layerRgba,
			lw * lh,
			ltype,
			bpp,
			colormap,
			colormapColors,
		);

		layers.push({
			width: lw,
			height: lh,
			type: ltype,
			offsetX,
			offsetY,
			opacity,
			visible,
			mode,
			pixels: layerRgba,
		});
	}

	if (layers.length === 0) {
		throw new Error(
			"This XCF file could not be decoded. No visible layers found.",
		);
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	// --- Composite layers bottom-to-top ---
	const canvas = new Uint8Array(imgWidth * imgHeight * 4); // starts transparent

	// XCF lists layers top-to-bottom, so reverse for bottom-to-top compositing
	for (let li = layers.length - 1; li >= 0; li--) {
		const layer = layers[li];
		compositeLayer(canvas, imgWidth, imgHeight, layer);
	}

	return { data: canvas, width: imgWidth, height: imgHeight };
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/** Check if XCF version uses 64-bit offsets (v011 and later). */
function isVersion64Bit(version: string): boolean {
	if (version === "file") return false;
	const match = version.match(/^v(\d+)$/);
	if (!match) return false;
	return Number.parseInt(match[1], 10) >= 11;
}

/** Read a uint64 from DataView (big-endian). Throws if value exceeds safe integer. */
function readUint64(view: DataView, offset: number): number {
	const hi = view.getUint32(offset, false);
	const lo = view.getUint32(offset + 4, false);
	if (hi > 0x1fffff) {
		throw new Error("XCF offset exceeds safe integer range.");
	}
	return hi * 0x100000000 + lo;
}

/**
 * Read XCF property list. Calls handler for each property.
 * Returns the byte position after PROP_END.
 */
function readProperties(
	view: DataView,
	_bytes: Uint8Array,
	startPos: number,
	handler: (type: number, payloadLen: number, payloadOffset: number) => void,
): number {
	let pos = startPos;
	const len = view.byteLength;

	while (pos + 8 <= len) {
		const propType = view.getUint32(pos, false);
		pos += 4;
		const propLen = view.getUint32(pos, false);
		pos += 4;

		if (propType === 0) {
			// PROP_END
			break;
		}

		if (pos + propLen > len) break;

		handler(propType, propLen, pos);
		pos += propLen;
	}

	return pos;
}

/**
 * XCF-specific RLE decoder.
 *
 * Data is stored per-channel: all pixels for channel 0, then channel 1, etc.
 * Within each channel, RLE encoding works as:
 * - n in 0..126: next n+1 bytes are literals
 * - n in 128..255: repeat next byte (256-n+1) times
 * - n = 127: long run — read 2-byte big-endian count, then 1 value byte, repeat count times
 *
 * Returns channel-separated output: [ch0_pixel0, ch0_pixel1, ..., ch1_pixel0, ...].
 */
function decodeXcfRle(
	src: Uint8Array,
	pixelCount: number,
	bpp: number,
): Uint8Array {
	const out = new Uint8Array(pixelCount * bpp);
	let srcPos = 0;

	for (let ch = 0; ch < bpp; ch++) {
		let written = 0;
		const chOffset = ch * pixelCount;

		while (written < pixelCount && srcPos < src.length) {
			const n = src[srcPos++];

			if (n <= 126) {
				// Literal run: n+1 bytes
				const count = n + 1;
				for (let i = 0; i < count && written < pixelCount; i++) {
					out[chOffset + written++] = srcPos < src.length ? src[srcPos++] : 0;
				}
			} else if (n === 127) {
				// Long run: 2-byte BE count + 1 value byte
				if (srcPos + 2 >= src.length) break;
				const count = (src[srcPos] << 8) | src[srcPos + 1];
				srcPos += 2;
				const value = src[srcPos++];
				for (let i = 0; i < count && written < pixelCount; i++) {
					out[chOffset + written++] = value;
				}
			} else {
				// Repeat run: repeat next byte (256-n+1) times
				const count = 256 - n + 1;
				const value = srcPos < src.length ? src[srcPos++] : 0;
				for (let i = 0; i < count && written < pixelCount; i++) {
					out[chOffset + written++] = value;
				}
			}
		}
	}

	return out;
}

/**
 * Convert raw layer pixels to RGBA based on layer type.
 * Layer types: 0=RGB, 1=RGBA, 2=Gray, 3=GrayA, 4=Indexed, 5=IndexedA
 */
function convertToRgba(
	src: Uint8Array,
	dst: Uint8Array,
	pixelCount: number,
	layerType: number,
	bpp: number,
	colormap: Uint8Array | null,
	colormapColors: number,
): void {
	for (let i = 0; i < pixelCount; i++) {
		const si = i * bpp;
		const di = i * 4;

		switch (layerType) {
			case 0: // RGB (3 bpp)
				dst[di] = src[si];
				dst[di + 1] = src[si + 1];
				dst[di + 2] = src[si + 2];
				dst[di + 3] = 255;
				break;
			case 1: // RGBA (4 bpp)
				dst[di] = src[si];
				dst[di + 1] = src[si + 1];
				dst[di + 2] = src[si + 2];
				dst[di + 3] = src[si + 3];
				break;
			case 2: // Grayscale (1 bpp)
				dst[di] = src[si];
				dst[di + 1] = src[si];
				dst[di + 2] = src[si];
				dst[di + 3] = 255;
				break;
			case 3: // GrayscaleA (2 bpp)
				dst[di] = src[si];
				dst[di + 1] = src[si];
				dst[di + 2] = src[si];
				dst[di + 3] = src[si + 1];
				break;
			case 4: // Indexed (1 bpp)
				if (colormap && src[si] < colormapColors) {
					const ci = src[si] * 3;
					dst[di] = colormap[ci];
					dst[di + 1] = colormap[ci + 1];
					dst[di + 2] = colormap[ci + 2];
				}
				dst[di + 3] = 255;
				break;
			case 5: // IndexedA (2 bpp)
				if (colormap && src[si] < colormapColors) {
					const ci = src[si] * 3;
					dst[di] = colormap[ci];
					dst[di + 1] = colormap[ci + 1];
					dst[di + 2] = colormap[ci + 2];
				}
				dst[di + 3] = src[si + 1];
				break;
			default:
				// Unknown type — treat as opaque black
				dst[di] = 0;
				dst[di + 1] = 0;
				dst[di + 2] = 0;
				dst[di + 3] = 255;
		}
	}
}

/**
 * Composite a layer onto the canvas using Normal blend mode with alpha.
 * Accounts for layer x/y offset and per-layer opacity.
 */
function compositeLayer(
	canvas: Uint8Array,
	canvasW: number,
	canvasH: number,
	layer: {
		width: number;
		height: number;
		offsetX: number;
		offsetY: number;
		opacity: number;
		pixels: Uint8Array;
	},
): void {
	const { width: lw, height: lh, offsetX, offsetY, opacity, pixels } = layer;

	for (let ly = 0; ly < lh; ly++) {
		const cy = offsetY + ly;
		if (cy < 0 || cy >= canvasH) continue;

		for (let lx = 0; lx < lw; lx++) {
			const cx = offsetX + lx;
			if (cx < 0 || cx >= canvasW) continue;

			const si = (ly * lw + lx) * 4;
			const di = (cy * canvasW + cx) * 4;

			// Source alpha adjusted by layer opacity
			const srcA = (pixels[si + 3] * opacity) / 255 / 255;
			const dstA = canvas[di + 3] / 255;

			const outA = srcA + dstA * (1 - srcA);
			if (outA <= 0) continue;

			canvas[di] = (pixels[si] * srcA + canvas[di] * dstA * (1 - srcA)) / outA;
			canvas[di + 1] =
				(pixels[si + 1] * srcA + canvas[di + 1] * dstA * (1 - srcA)) / outA;
			canvas[di + 2] =
				(pixels[si + 2] * srcA + canvas[di + 2] * dstA * (1 - srcA)) / outA;
			canvas[di + 3] = outA * 255;
		}
	}
}
