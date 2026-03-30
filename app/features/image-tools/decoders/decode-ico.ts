import type { DecodedImage } from "./types";

interface IcoFrame {
	width: number;
	height: number;
	data: Uint8Array | Uint8ClampedArray;
	type: "png" | "bmp";
	bpp: number;
}

/**
 * Decode an ICO/CUR file to raw RGBA pixels using decode-ico.
 * Selects the largest frame. Handles both BMP and PNG-compressed frames.
 */
export async function decodeIco(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const { default: decodeIcoLib } = await import("decode-ico");

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const frames = decodeIcoLib(buffer) as IcoFrame[];
	if (!frames || frames.length === 0) {
		throw new Error(
			"This ICO file could not be decoded. It may be corrupted or use an unsupported variant.",
		);
	}

	// Pick the largest frame by pixel count
	let best = frames[0];
	for (const frame of frames) {
		if (frame.width * frame.height > best.width * best.height) {
			best = frame;
		}
	}

	if (best.type === "bmp") {
		// BMP frames: decode-ico returns ImageData-like object with RGBA .data
		return {
			data: new Uint8Array(
				best.data.buffer,
				best.data.byteOffset,
				best.data.byteLength,
			),
			width: best.width,
			height: best.height,
		};
	}

	// PNG frames: .data is the raw PNG file bytes — decode via browser
	const pngBlob = new Blob([best.data], { type: "image/png" });
	const bitmap = await createImageBitmap(pngBlob);
	const canvas = document.createElement("canvas");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("Could not get canvas 2D context");
	}
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	return {
		data: new Uint8Array(
			imageData.data.buffer,
			imageData.data.byteOffset,
			imageData.data.byteLength,
		),
		width: canvas.width,
		height: canvas.height,
	};
}
