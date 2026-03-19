const MAX_DIMENSION = 16384;
const OPAQUE_FORMATS = new Set(["image/jpeg"]);

export interface ConvertImageMessage {
	blob: Blob;
	outputFormat: string;
	quality?: number;
	backgroundColor?: string;
}

self.onmessage = async (e: MessageEvent<ConvertImageMessage>) => {
	try {
		const {
			blob,
			outputFormat,
			quality = 0.92,
			backgroundColor = "#ffffff",
		} = e.data;

		const bitmap = await createImageBitmap(blob);
		const { width, height } = bitmap;

		if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
			bitmap.close();
			throw new Error(
				`Image dimensions ${width}×${height} exceed the maximum of ${MAX_DIMENSION}px`,
			);
		}

		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			bitmap.close();
			throw new Error("Could not get OffscreenCanvas 2D context");
		}

		// For formats that don't support transparency, fill a solid background
		if (OPAQUE_FORMATS.has(outputFormat)) {
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, width, height);
		}

		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();

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
