import { decompressFrames, parseGIF } from "gifuct-js";

const MAX_FRAMES = 500;
const THUMBNAIL_HEIGHT = 80;

export interface ParseGifMessage {
	buffer: ArrayBuffer;
}

export interface GifFrameResult {
	thumbnailBlob: Blob;
	fullBlob: Blob;
	delay: number;
	index: number;
}

export interface ParseGifResponse {
	frames: GifFrameResult[];
	width: number;
	height: number;
	error?: undefined;
}

export interface ParseGifError {
	error: string;
	frames?: undefined;
}

self.onmessage = async (e: MessageEvent<ParseGifMessage>) => {
	try {
		const { buffer } = e.data;
		const gif = parseGIF(buffer);
		const rawFrames = decompressFrames(gif, true);

		const gifWidth = gif.lsd.width;
		const gifHeight = gif.lsd.height;
		const frameCount = Math.min(rawFrames.length, MAX_FRAMES);

		// Composite canvas — accumulates frame patches respecting disposal
		const compositeCanvas = new OffscreenCanvas(gifWidth, gifHeight);
		const compositeCtx = compositeCanvas.getContext("2d");
		if (!compositeCtx) {
			throw new Error("Could not get OffscreenCanvas 2D context for composite");
		}

		// Previous canvas state for disposalType 3 (restore to previous)
		let previousImageData: ImageData | null = null;

		// Thumbnail sizing
		const thumbScale = THUMBNAIL_HEIGHT / gifHeight;
		const thumbWidth = Math.round(gifWidth * thumbScale);
		const thumbCanvas = new OffscreenCanvas(thumbWidth, THUMBNAIL_HEIGHT);
		const thumbCtx = thumbCanvas.getContext("2d");
		if (!thumbCtx) {
			throw new Error("Could not get OffscreenCanvas 2D context for thumbnail");
		}

		const results: GifFrameResult[] = [];

		for (let i = 0; i < frameCount; i++) {
			const frame = rawFrames[i];
			const { dims, patch, disposalType } = frame;

			// Save state before drawing if disposal is "restore to previous"
			if (disposalType === 3) {
				previousImageData = compositeCtx.getImageData(
					0,
					0,
					gifWidth,
					gifHeight,
				);
			}

			// Draw the frame patch onto the composite canvas
			const frameImageData = new ImageData(
				new Uint8ClampedArray(patch),
				dims.width,
				dims.height,
			);
			compositeCtx.putImageData(frameImageData, dims.left, dims.top);

			// Render full-res blob
			const fullBlob = await compositeCanvas.convertToBlob({
				type: "image/png",
			});

			// Render thumbnail
			thumbCtx.clearRect(0, 0, thumbWidth, THUMBNAIL_HEIGHT);
			thumbCtx.drawImage(compositeCanvas, 0, 0, thumbWidth, THUMBNAIL_HEIGHT);
			const thumbnailBlob = await thumbCanvas.convertToBlob({
				type: "image/png",
			});

			results.push({
				thumbnailBlob,
				fullBlob,
				delay: frame.delay,
				index: i,
			});

			// Apply disposal method for the next frame
			if (disposalType === 2) {
				// Restore to background (clear the frame area)
				compositeCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
			} else if (disposalType === 3 && previousImageData) {
				// Restore to previous state
				compositeCtx.putImageData(previousImageData, 0, 0);
				previousImageData = null;
			}
		}

		self.postMessage({
			frames: results,
			width: gifWidth,
			height: gifHeight,
		} satisfies ParseGifResponse);
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		} satisfies ParseGifError);
	}
};
