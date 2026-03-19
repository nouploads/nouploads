const MAX_DIMENSION = 16384;

export interface CompressPngMessage {
	blob: Blob;
	colors: number;
}

self.onmessage = async (e: MessageEvent<CompressPngMessage>) => {
	try {
		const { blob, colors } = e.data;

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

		const imageData = ctx.getImageData(0, 0, width, height);

		const { utils, buildPalette, applyPalette } = await import("image-q");

		const pointContainer = utils.PointContainer.fromImageData(imageData);

		const palette = await buildPalette([pointContainer], {
			colorDistanceFormula: "euclidean-bt709",
			paletteQuantization: "wuquant",
			colors,
		});

		const quantized = await applyPalette(pointContainer, palette, {
			colorDistanceFormula: "euclidean-bt709",
			imageQuantization: "floyd-steinberg",
		});

		const outData = new ImageData(
			new Uint8ClampedArray(quantized.toUint8Array()),
			width,
			height,
		);
		ctx.putImageData(outData, 0, 0);

		const resultBlob = await canvas.convertToBlob({ type: "image/png" });
		self.postMessage({ blob: resultBlob, width, height });
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
