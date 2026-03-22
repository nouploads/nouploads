import {
	type CompressFormatConfig,
	CompressToolBase,
} from "~/features/image-tools/components/compress-tool-base";
import { compressGif } from "~/features/image-tools/processors/compress-gif";
import {
	compressImage,
	compressImageBatch,
} from "~/features/image-tools/processors/compress-image";
import { ACCEPT_COMPRESSIBLE } from "~/lib/accept";

export interface ImageCompressorProps {
	/** Restrict accepted input formats for format-specific landing pages */
	accept?: Record<string, string[]>;
}

/** Map the quality slider (10–100) to a gifsicle lossy value (0–180). */
function qualityToLossy(quality: number): number {
	return Math.round((100 - quality) * 2);
}

async function compressAny(
	input: Blob,
	sliderValue: number,
	signal?: AbortSignal,
) {
	if (input.type === "image/gif") {
		const result = await compressGif(input, {
			lossy: qualityToLossy(sliderValue),
			colors: 256,
			optimizeTransparency: true,
			signal,
		});
		// CompressResult expects width/height — decode to get dimensions
		const bmp = await createImageBitmap(result.blob);
		const { width, height } = bmp;
		bmp.close();
		return { blob: result.blob, width, height };
	}
	return compressImage(input, { quality: sliderValue / 100, signal });
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
	compress: compressAny,
	compressBatch: async (inputs, sliderValue, onProgress, signal) => {
		const results: ({ blob: Blob; width: number; height: number } | Error)[] =
			[];
		for (let i = 0; i < inputs.length; i++) {
			try {
				const output = await compressAny(inputs[i], sliderValue, signal);
				results.push(output);
			} catch (err) {
				results.push(err instanceof Error ? err : new Error(String(err)));
			}
			onProgress?.(i, inputs.length);
		}
		return results;
	},
};

export default function ImageCompressorTool({
	accept,
}: ImageCompressorProps = {}) {
	const effectiveConfig = accept ? { ...config, accept } : config;
	return <CompressToolBase config={effectiveConfig} />;
}
