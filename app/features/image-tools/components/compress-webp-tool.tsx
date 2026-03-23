import {
	type CompressFormatConfig,
	CompressToolBase,
} from "~/features/image-tools/components/compress-tool-base";
import {
	compressImage,
	compressImageBatch,
} from "~/features/image-tools/processors/compress-image";

export const webpCompressConfig: CompressFormatConfig = {
	accept: { "image/webp": [".webp"] },
	outputMime: "image/webp",
	fileExtension: ".webp",
	sliderDefault: 80,
	sliderMin: 10,
	sliderMax: 100,
	sliderStep: 1,
	sliderLabel: (v) => `Quality: ${v}%`,
	compress: (input, sliderValue, signal) =>
		compressImage(input, {
			quality: sliderValue / 100,
			outputFormat: "image/webp",
			signal,
		}),
	compressBatch: (inputs, sliderValue, onProgress, signal) =>
		compressImageBatch(
			inputs,
			{ quality: sliderValue / 100, outputFormat: "image/webp", signal },
			onProgress,
		),
};

export default function CompressWebpTool() {
	return <CompressToolBase config={webpCompressConfig} />;
}
