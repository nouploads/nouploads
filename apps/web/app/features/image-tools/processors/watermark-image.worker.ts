export interface WatermarkImageMessage {
	blob: Blob;
	text: string;
	fontSize: number;
	opacity: number;
	rotation: number;
	color: string;
	mode: "center" | "tiled";
	outputFormat: string;
	quality: number;
}

self.onmessage = async (e: MessageEvent<WatermarkImageMessage>) => {
	try {
		const {
			blob,
			text,
			fontSize,
			opacity,
			rotation,
			color,
			mode,
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

		// Draw original image
		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();

		// Apply watermark
		ctx.globalAlpha = opacity;
		ctx.fillStyle = color;
		ctx.font = `${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		const rotationRad = (rotation * Math.PI) / 180;

		if (mode === "tiled") {
			const spacingX = fontSize * 6;
			const spacingY = fontSize * 4;
			for (let y = -height; y < height * 2; y += spacingY) {
				for (let x = -width; x < width * 2; x += spacingX) {
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(rotationRad);
					ctx.fillText(text, 0, 0);
					ctx.restore();
				}
			}
		} else {
			ctx.save();
			ctx.translate(width / 2, height / 2);
			ctx.rotate(rotationRad);
			ctx.fillText(text, 0, 0);
			ctx.restore();
		}

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
