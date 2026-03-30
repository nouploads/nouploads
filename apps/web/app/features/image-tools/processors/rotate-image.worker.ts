export type RotateAction =
	| "rotate-cw"
	| "rotate-ccw"
	| "rotate-180"
	| "flip-h"
	| "flip-v";

export interface RotateImageMessage {
	blob: Blob;
	action: RotateAction;
	outputFormat: string;
	quality: number;
}

self.onmessage = async (e: MessageEvent<RotateImageMessage>) => {
	try {
		const { blob, action, outputFormat, quality } = e.data;

		const bitmap = await createImageBitmap(blob);
		const srcW = bitmap.width;
		const srcH = bitmap.height;

		const swapDimensions = action === "rotate-cw" || action === "rotate-ccw";
		const outW = swapDimensions ? srcH : srcW;
		const outH = swapDimensions ? srcW : srcH;

		const canvas = new OffscreenCanvas(outW, outH);
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			bitmap.close();
			throw new Error("Could not get OffscreenCanvas 2D context");
		}

		switch (action) {
			case "rotate-cw":
				ctx.translate(outW, 0);
				ctx.rotate(Math.PI / 2);
				break;
			case "rotate-ccw":
				ctx.translate(0, outH);
				ctx.rotate(-Math.PI / 2);
				break;
			case "rotate-180":
				ctx.translate(outW, outH);
				ctx.rotate(Math.PI);
				break;
			case "flip-h":
				ctx.scale(-1, 1);
				ctx.translate(-outW, 0);
				break;
			case "flip-v":
				ctx.scale(1, -1);
				ctx.translate(0, -outH);
				break;
		}

		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();

		const qualityParam = outputFormat === "image/png" ? undefined : quality;
		const result = await canvas.convertToBlob({
			type: outputFormat,
			quality: qualityParam,
		});

		self.postMessage({
			blob: result,
			width: outW,
			height: outH,
		});
	} catch (err) {
		self.postMessage({
			error: err instanceof Error ? err.message : String(err),
		});
	}
};
