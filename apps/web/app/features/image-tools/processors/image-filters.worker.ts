export interface ImageFiltersMessage {
	blob: Blob;
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	hueRotate: number;
	grayscale: number;
	sepia: number;
	invert: number;
	outputFormat: string;
	quality: number;
}

self.onmessage = async (e: MessageEvent<ImageFiltersMessage>) => {
	try {
		const {
			blob,
			brightness,
			contrast,
			saturation,
			blur,
			hueRotate,
			grayscale,
			sepia,
			invert,
			outputFormat,
			quality,
		} = e.data;

		const bitmap = await createImageBitmap(blob);
		const { width, height } = bitmap;
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			bitmap.close();
			throw new Error("Could not get OffscreenCanvas 2D context");
		}

		// Build CSS filter string
		ctx.filter = [
			`brightness(${brightness}%)`,
			`contrast(${contrast}%)`,
			`saturate(${saturation}%)`,
			`blur(${blur}px)`,
			`hue-rotate(${hueRotate}deg)`,
			`grayscale(${grayscale}%)`,
			`sepia(${sepia}%)`,
			`invert(${invert}%)`,
		].join(" ");

		ctx.drawImage(bitmap, 0, 0);
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
