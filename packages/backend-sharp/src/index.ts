import type {
	CropRegion,
	EncodeOptions,
	ImageBackend,
	ImageData,
	ResizeOptions,
} from "@nouploads/core";
import sharp from "sharp";

export function createSharpBackend(): ImageBackend {
	return {
		async decode(input: Uint8Array, _format: string): Promise<ImageData> {
			const image = sharp(Buffer.from(input));
			const metadata = await image.metadata();
			if (!metadata.width || !metadata.height) {
				throw new Error("Failed to read image dimensions");
			}
			const { data } = await image
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			return {
				width: metadata.width,
				height: metadata.height,
				data: new Uint8Array(data),
			};
		},

		async encode(
			image: ImageData,
			options: EncodeOptions,
		): Promise<Uint8Array> {
			const raw = sharp(Buffer.from(image.data), {
				raw: { width: image.width, height: image.height, channels: 4 },
			});

			const format = options.format.toLowerCase();
			const quality = options.quality ?? 80;

			let pipeline: sharp.Sharp;
			switch (format) {
				case "jpeg":
				case "jpg":
					pipeline = raw.jpeg({ quality });
					break;
				case "png":
					pipeline = raw.png();
					break;
				case "webp":
					pipeline = raw.webp({ quality });
					break;
				case "avif":
					pipeline = raw.avif({ quality });
					break;
				case "gif":
					pipeline = raw.gif();
					break;
				case "tiff":
					pipeline = raw.tiff({ quality });
					break;
				default:
					throw new Error(`Unsupported output format: ${format}`);
			}

			const buffer = await pipeline.toBuffer();
			return new Uint8Array(buffer);
		},

		async resize(image: ImageData, options: ResizeOptions): Promise<ImageData> {
			const result = await sharp(Buffer.from(image.data), {
				raw: { width: image.width, height: image.height, channels: 4 },
			})
				.resize({
					width: options.width,
					height: options.height,
					fit: options.fit ?? "inside",
				})
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			return {
				width: result.info.width,
				height: result.info.height,
				data: new Uint8Array(result.data),
			};
		},

		async crop(image: ImageData, region: CropRegion): Promise<ImageData> {
			const result = await sharp(Buffer.from(image.data), {
				raw: { width: image.width, height: image.height, channels: 4 },
			})
				.extract({
					left: region.x,
					top: region.y,
					width: region.width,
					height: region.height,
				})
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			return {
				width: result.info.width,
				height: result.info.height,
				data: new Uint8Array(result.data),
			};
		},

		async quantize(image: ImageData, colors: number): Promise<ImageData> {
			// Sharp's PNG palette mode handles quantization internally
			// We round-trip through PNG with palette mode to quantize
			const pngBuffer = await sharp(Buffer.from(image.data), {
				raw: { width: image.width, height: image.height, channels: 4 },
			})
				.png({ palette: true, colours: colors })
				.toBuffer();

			// Decode back to raw pixels
			const result = await sharp(pngBuffer)
				.raw()
				.ensureAlpha()
				.toBuffer({ resolveWithObject: true });

			return {
				width: result.info.width,
				height: result.info.height,
				data: new Uint8Array(result.data),
			};
		},

		async transcode(
			input: Uint8Array,
			_from: string,
			to: string,
			options?: EncodeOptions,
		): Promise<Uint8Array> {
			const image = sharp(Buffer.from(input));
			const format = to.toLowerCase();
			const quality = options?.quality ?? 80;

			let pipeline: sharp.Sharp;
			switch (format) {
				case "jpeg":
				case "jpg":
					pipeline = image.jpeg({ quality });
					break;
				case "png":
					pipeline = image.png();
					break;
				case "webp":
					pipeline = image.webp({ quality });
					break;
				case "avif":
					pipeline = image.avif({ quality });
					break;
				default:
					throw new Error(`Unsupported transcode format: ${format}`);
			}

			const buffer = await pipeline.toBuffer();
			return new Uint8Array(buffer);
		},
	};
}
