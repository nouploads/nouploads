const MAX_DIMENSION = 16384;

export interface CompressImageMessage {
	blob: Blob;
	quality: number;
	outputFormat: string;
	inputMime: string;
}

/**
 * Resolve the actual MIME type to use for OffscreenCanvas encoding.
 * Canvas cannot encode AVIF, so we fall back to WebP.
 */
function resolveOutputMime(inputMime: string, outputFormat: string): string {
	if (outputFormat !== "same") return outputFormat;

	switch (inputMime) {
		case "image/jpeg":
		case "image/png":
		case "image/webp":
			return inputMime;
		default:
			return "image/webp";
	}
}

self.onmessage = async (e: MessageEvent<CompressImageMessage>) => {
	try {
		const { blob, quality, outputFormat, inputMime } = e.data;

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

		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();

		const mime = resolveOutputMime(inputMime, outputFormat);
		const qualityParam = mime === "image/png" ? undefined : quality;

		const resultBlob = await canvas.convertToBlob({
			type: mime,
			quality: qualityParam,
		});

		self.postMessage({ blob: resultBlob, width, height });
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
