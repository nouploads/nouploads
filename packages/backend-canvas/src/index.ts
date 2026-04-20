import type {
	CropRegion,
	EncodeOptions,
	ImageBackend,
	ImageData,
	ResizeOptions,
} from "@nouploads/core";

/**
 * Browser image backend using OffscreenCanvas where available, falling back to regular Canvas.
 * Note: This file is browser-only. Do not import in Node.js contexts.
 */
export function createCanvasBackend(): ImageBackend {
	function createCanvas(
		width: number,
		height: number,
	): OffscreenCanvas | HTMLCanvasElement {
		if (typeof OffscreenCanvas !== "undefined") {
			return new OffscreenCanvas(width, height);
		}
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	function getContext(canvas: OffscreenCanvas | HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Failed to get 2d context");
		return ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	}

	return {
		async decode(input: Uint8Array, _format: string): Promise<ImageData> {
			const blob = new Blob([input as BlobPart]);
			const bitmap = await createImageBitmap(blob);
			const canvas = createCanvas(bitmap.width, bitmap.height);
			const ctx = getContext(canvas);
			ctx.drawImage(bitmap, 0, 0);
			const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
			bitmap.close();
			return {
				width: imageData.width,
				height: imageData.height,
				data: new Uint8Array(imageData.data.buffer),
			};
		},

		async encode(
			image: ImageData,
			options: EncodeOptions,
		): Promise<Uint8Array> {
			const canvas = createCanvas(image.width, image.height);
			const ctx = getContext(canvas);
			const imgData = new globalThis.ImageData(
				new Uint8ClampedArray(image.data),
				image.width,
				image.height,
			);
			ctx.putImageData(imgData, 0, 0);

			const mimeMap: Record<string, string> = {
				jpeg: "image/jpeg",
				jpg: "image/jpeg",
				png: "image/png",
				webp: "image/webp",
				avif: "image/avif",
			};
			const mime = mimeMap[options.format.toLowerCase()] ?? "image/png";
			const quality = options.quality ? options.quality / 100 : 0.8;

			let blob: Blob;
			if (canvas instanceof OffscreenCanvas) {
				blob = await canvas.convertToBlob({ type: mime, quality });
			} else {
				blob = await new Promise<Blob>((resolve, reject) => {
					canvas.toBlob(
						(b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
						mime,
						quality,
					);
				});
			}
			return new Uint8Array(await blob.arrayBuffer());
		},

		async resize(image: ImageData, options: ResizeOptions): Promise<ImageData> {
			const targetW = options.width ?? image.width;
			const targetH = options.height ?? image.height;

			// Draw source image
			const srcCanvas = createCanvas(image.width, image.height);
			const srcCtx = getContext(srcCanvas);
			const imgData = new globalThis.ImageData(
				new Uint8ClampedArray(image.data),
				image.width,
				image.height,
			);
			srcCtx.putImageData(imgData, 0, 0);

			// Resize
			const dstCanvas = createCanvas(targetW, targetH);
			const dstCtx = getContext(dstCanvas);
			dstCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);

			const result = dstCtx.getImageData(0, 0, targetW, targetH);
			return {
				width: result.width,
				height: result.height,
				data: new Uint8Array(result.data.buffer),
			};
		},

		async quantize(image: ImageData, colors: number): Promise<ImageData> {
			const { utils, buildPalette, applyPalette } = await import("image-q");
			const srcData = new globalThis.ImageData(
				new Uint8ClampedArray(image.data),
				image.width,
				image.height,
			);
			const pointContainer = utils.PointContainer.fromImageData(srcData);
			const palette = await buildPalette([pointContainer], {
				colorDistanceFormula: "euclidean-bt709",
				paletteQuantization: "wuquant",
				colors,
			});
			const quantized = await applyPalette(pointContainer, palette, {
				colorDistanceFormula: "euclidean-bt709",
				imageQuantization: "floyd-steinberg",
			});
			return {
				width: image.width,
				height: image.height,
				data: new Uint8Array(quantized.toUint8Array()),
			};
		},

		async crop(image: ImageData, region: CropRegion): Promise<ImageData> {
			const srcCanvas = createCanvas(image.width, image.height);
			const srcCtx = getContext(srcCanvas);
			const imgData = new globalThis.ImageData(
				new Uint8ClampedArray(image.data),
				image.width,
				image.height,
			);
			srcCtx.putImageData(imgData, 0, 0);

			const dstCanvas = createCanvas(region.width, region.height);
			const dstCtx = getContext(dstCanvas);
			dstCtx.drawImage(
				srcCanvas,
				region.x,
				region.y,
				region.width,
				region.height,
				0,
				0,
				region.width,
				region.height,
			);

			const result = dstCtx.getImageData(0, 0, region.width, region.height);
			return {
				width: result.width,
				height: result.height,
				data: new Uint8Array(result.data.buffer),
			};
		},
	};
}
