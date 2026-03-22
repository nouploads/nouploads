import {
	type CompressFormatConfig,
	CompressToolBase,
} from "~/features/image-tools/components/compress-tool-base";
import {
	compressGif,
	compressGifBatch,
} from "~/features/image-tools/processors/compress-gif";

/** Map quality slider (10–100) to gifsicle lossy value (0–180). */
function qualityToLossy(quality: number): number {
	return Math.round((100 - quality) * 2);
}

async function compressGifWithDimensions(
	input: Blob,
	sliderValue: number,
	signal?: AbortSignal,
) {
	const result = await compressGif(input, {
		lossy: qualityToLossy(sliderValue),
		colors: 256,
		optimizeTransparency: true,
		signal,
	});
	const bmp = await createImageBitmap(result.blob);
	const { width, height } = bmp;
	bmp.close();
	return { blob: result.blob, width, height };
}

const config: CompressFormatConfig = {
	accept: { "image/gif": [".gif"] },
	outputMime: "image/gif",
	fileExtension: ".gif",
	sliderDefault: 80,
	sliderMin: 10,
	sliderMax: 100,
	sliderStep: 1,
	sliderLabel: (v) => `Quality: ${v}%`,
	compress: compressGifWithDimensions,
	compressBatch: async (inputs, sliderValue, onProgress, signal) => {
		const results: ({ blob: Blob; width: number; height: number } | Error)[] =
			[];
		for (let i = 0; i < inputs.length; i++) {
			try {
				const output = await compressGifWithDimensions(
					inputs[i],
					sliderValue,
					signal,
				);
				results.push(output);
			} catch (err) {
				results.push(err instanceof Error ? err : new Error(String(err)));
			}
			onProgress?.(i, inputs.length);
		}
		return results;
	},
};

export default function CompressGifTool() {
	return <CompressToolBase config={config} />;
}
