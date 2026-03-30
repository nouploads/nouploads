/**
 * Platform-agnostic image processing interface.
 * Browser adapter uses Canvas API. Node adapter uses sharp (libvips).
 * This abstraction is what allows the same core logic to run everywhere.
 */
export interface ImageData {
	width: number;
	height: number;
	/** Raw RGBA pixel data */
	data: Uint8Array;
}

export interface EncodeOptions {
	format: string;
	quality?: number; // 1-100
}

export interface ResizeOptions {
	width?: number;
	height?: number;
	fit?: "contain" | "cover" | "fill" | "inside" | "outside";
}

export interface CropRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ImageBackend {
	decode(input: Uint8Array, format: string): Promise<ImageData>;
	encode(image: ImageData, options: EncodeOptions): Promise<Uint8Array>;
	resize(image: ImageData, options: ResizeOptions): Promise<ImageData>;
	/** Direct format-to-format transcoding (may be more efficient than decode+encode) */
	transcode?(
		input: Uint8Array,
		from: string,
		to: string,
		options?: EncodeOptions,
	): Promise<Uint8Array>;
	/** Crop an image to a specified region */
	crop?(image: ImageData, region: CropRegion): Promise<ImageData>;
	/** Quantize image colors for palette-based formats like PNG */
	quantize?(image: ImageData, colors: number): Promise<ImageData>;
}
