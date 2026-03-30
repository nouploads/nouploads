export interface VectorDecoderResult {
	svgMarkup: string;
	width?: number;
	height?: number;
	sourceFormat: string;
}

export type VectorDecoderFn = (
	input: Blob,
	signal?: AbortSignal,
) => Promise<VectorDecoderResult>;
