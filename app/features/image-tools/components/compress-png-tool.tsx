import {
	type CompressFormatConfig,
	CompressToolBase,
} from "~/features/image-tools/components/compress-tool-base";
import {
	compressPng,
	compressPngBatch,
} from "~/features/image-tools/processors/compress-png";

export const pngCompressConfig: CompressFormatConfig = {
	accept: { "image/png": [".png"] },
	outputMime: "image/png",
	fileExtension: ".png",
	sliderDefault: 256,
	sliderMin: 2,
	sliderMax: 256,
	sliderStep: 1,
	sliderLabel: (v) => `Colors: ${v}`,
	compress: (input, sliderValue, signal) =>
		compressPng(input, { colors: sliderValue, signal }),
	compressBatch: (inputs, sliderValue, onProgress, signal) =>
		compressPngBatch(inputs, { colors: sliderValue, signal }, onProgress),
};

export default function CompressPngTool() {
	return <CompressToolBase config={pngCompressConfig} />;
}
