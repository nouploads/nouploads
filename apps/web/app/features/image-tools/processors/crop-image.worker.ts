export interface CropImageMessage {
	blob: Blob;
	x: number;
	y: number;
	width: number;
	height: number;
	outputFormat: string;
	quality: number;
}

self.onmessage = async (e: MessageEvent<CropImageMessage>) => {
	try {
		const { blob, x, y, width, height, outputFormat, quality } = e.data;

		const bitmap = await createImageBitmap(blob);
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			bitmap.close();
			throw new Error("Could not get OffscreenCanvas 2D context");
		}

		ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
		bitmap.close();

		const qualityParam = outputFormat === "image/png" ? undefined : quality;
		const result = await canvas.convertToBlob({
			type: outputFormat,
			quality: qualityParam,
		});

		self.postMessage({ blob: result, width, height });
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
