const MAX_DIMENSION = 16384;
const OPAQUE_FORMATS = new Set(["image/jpeg"]);

export interface ConvertImageMessage {
	blob?: Blob;
	/** Raw RGBA pixel data from a non-browser-native decoder. */
	pixelData?: Uint8Array;
	pixelWidth?: number;
	pixelHeight?: number;
	outputFormat: string;
	quality?: number;
	backgroundColor?: string;
}

self.onmessage = async (e: MessageEvent<ConvertImageMessage>) => {
	try {
		const {
			blob,
			pixelData,
			pixelWidth,
			pixelHeight,
			outputFormat,
			quality = 0.92,
			backgroundColor = "#ffffff",
		} = e.data;

		let width: number;
		let height: number;
		let canvas: OffscreenCanvas;
		let ctx: OffscreenCanvasRenderingContext2D;

		if (pixelData && pixelWidth && pixelHeight) {
			// Path B: Raw RGBA pixels from an exotic format decoder
			width = pixelWidth;
			height = pixelHeight;

			if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
				throw new Error(
					`Image dimensions ${width}×${height} exceed the maximum of ${MAX_DIMENSION}px`,
				);
			}

			canvas = new OffscreenCanvas(width, height);
			const rawCtx = canvas.getContext("2d");
			if (!rawCtx) throw new Error("Could not get OffscreenCanvas 2D context");
			ctx = rawCtx;

			// Fill background first for opaque formats (alpha will be overwritten by putImageData)
			if (OPAQUE_FORMATS.has(outputFormat)) {
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, width, height);
			}

			const imageData = new ImageData(
				new Uint8ClampedArray(
					pixelData.buffer,
					pixelData.byteOffset,
					pixelData.byteLength,
				),
				width,
				height,
			);

			if (OPAQUE_FORMATS.has(outputFormat)) {
				// For opaque output: draw pixels onto a temp canvas, then drawImage
				// (putImageData replaces pixels including alpha, ignoring the background fill)
				const tmp = new OffscreenCanvas(width, height);
				const tmpCtx = tmp.getContext("2d");
				if (!tmpCtx)
					throw new Error("Could not get temp OffscreenCanvas 2D context");
				tmpCtx.putImageData(imageData, 0, 0);
				ctx.drawImage(tmp, 0, 0);
			} else {
				ctx.putImageData(imageData, 0, 0);
			}
		} else if (blob) {
			// Path A: Browser-decodable Blob (existing path)
			const bitmap = await createImageBitmap(blob);
			width = bitmap.width;
			height = bitmap.height;

			if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
				bitmap.close();
				throw new Error(
					`Image dimensions ${width}×${height} exceed the maximum of ${MAX_DIMENSION}px`,
				);
			}

			canvas = new OffscreenCanvas(width, height);
			const rawCtx = canvas.getContext("2d");
			if (!rawCtx) {
				bitmap.close();
				throw new Error("Could not get OffscreenCanvas 2D context");
			}
			ctx = rawCtx;

			if (OPAQUE_FORMATS.has(outputFormat)) {
				ctx.fillStyle = backgroundColor;
				ctx.fillRect(0, 0, width, height);
			}

			ctx.drawImage(bitmap, 0, 0);
			bitmap.close();
		} else {
			throw new Error("Worker received neither blob nor pixelData");
		}

		const qualityParam = outputFormat === "image/png" ? undefined : quality;

		const resultBlob = await canvas.convertToBlob({
			type: outputFormat,
			quality: qualityParam,
		});

		self.postMessage({ blob: resultBlob, width, height });
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
