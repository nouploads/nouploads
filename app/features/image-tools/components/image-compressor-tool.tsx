import {
	type CompressFormatConfig,
	CompressToolBase,
} from "~/features/image-tools/components/compress-tool-base";
import {
	compressImage,
	compressImageBatch,
} from "~/features/image-tools/processors/compress-image";
import { ACCEPT_COMPRESSIBLE } from "~/lib/accept";

export interface ImageCompressorProps {
	/** Restrict accepted input formats for format-specific landing pages */
	accept?: Record<string, string[]>;
}

const config: CompressFormatConfig = {
	accept: ACCEPT_COMPRESSIBLE,
	outputMime: "same",
	fileExtension: "",
	sliderDefault: 80,
	sliderMin: 10,
	sliderMax: 100,
	sliderStep: 1,
	sliderLabel: (v) => `Quality: ${v}%`,
	compress: (input, sliderValue, signal) =>
		compressImage(input, {
			quality: sliderValue / 100,
			signal,
		}),
	compressBatch: (inputs, sliderValue, onProgress, signal) =>
		compressImageBatch(
			inputs,
			{ quality: sliderValue / 100, signal },
			onProgress,
		),
};

export default function ImageCompressorTool({
	accept,
}: ImageCompressorProps = {}) {
	const effectiveConfig = accept ? { ...config, accept } : config;
	return <CompressToolBase config={effectiveConfig} />;
}
