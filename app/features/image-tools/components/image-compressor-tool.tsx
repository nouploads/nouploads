import { gifCompressConfig } from "~/features/image-tools/components/compress-gif-tool";
import { jpgCompressConfig } from "~/features/image-tools/components/compress-jpg-tool";
import { pngCompressConfig } from "~/features/image-tools/components/compress-png-tool";
import {
	type CompressFormatConfig,
	CompressToolBase,
} from "~/features/image-tools/components/compress-tool-base";
import { webpCompressConfig } from "~/features/image-tools/components/compress-webp-tool";
import { ACCEPT_COMPRESSIBLE } from "~/lib/accept";

/** Map MIME type to the canonical format-specific config. */
const CONFIG_BY_MIME: Record<string, CompressFormatConfig> = {
	"image/gif": gifCompressConfig,
	"image/jpeg": jpgCompressConfig,
	"image/png": pngCompressConfig,
	"image/webp": webpCompressConfig,
};

function resolveConfig(mime: string): CompressFormatConfig {
	const base = CONFIG_BY_MIME[mime] ?? jpgCompressConfig;
	return { ...base, accept: ACCEPT_COMPRESSIBLE, fileExtension: "" };
}

/**
 * Universal compress tool — accepts any compressible image format and
 * dynamically selects the matching format-specific config so sliders,
 * processors, and options are always in sync with the dedicated pages.
 */
export default function ImageCompressorTool() {
	return (
		<CompressToolBase
			resolveConfig={resolveConfig}
			accept={ACCEPT_COMPRESSIBLE}
		/>
	);
}
