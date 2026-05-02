import { FORMAT_TO_EXTENSION, FORMAT_TO_MIME } from "../format-maps.js";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/**
 * Sniff the format of a raw image buffer from its magic bytes.
 * Returns one of "jpg" | "png" | "webp" | "gif" | "bmp" | "tiff" | "avif",
 * or undefined when the bytes don't match any of the supported formats.
 *
 * Used by resize-image when the caller didn't pass `--format`: previously
 * the tool always wrote PNG even though `--info` said "defaults to same as
 * input". Sniffing here keeps the documented contract.
 */
function sniffImageFormat(input: Uint8Array): string | undefined {
	if (input.length < 12) return undefined;
	// JPEG: FF D8 FF
	if (input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) return "jpg";
	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		input[0] === 0x89 &&
		input[1] === 0x50 &&
		input[2] === 0x4e &&
		input[3] === 0x47
	)
		return "png";
	// GIF: "GIF87a" or "GIF89a"
	if (
		input[0] === 0x47 &&
		input[1] === 0x49 &&
		input[2] === 0x46 &&
		input[3] === 0x38
	)
		return "gif";
	// BMP: "BM"
	if (input[0] === 0x42 && input[1] === 0x4d) return "bmp";
	// TIFF: "II*\0" (little-endian) or "MM\0*" (big-endian)
	if (
		(input[0] === 0x49 && input[1] === 0x49 && input[2] === 0x2a) ||
		(input[0] === 0x4d && input[1] === 0x4d && input[3] === 0x2a)
	)
		return "tiff";
	// RIFF container — check tag at offset 8 to disambiguate WebP vs others
	if (
		input[0] === 0x52 &&
		input[1] === 0x49 &&
		input[2] === 0x46 &&
		input[3] === 0x46
	) {
		if (
			input[8] === 0x57 &&
			input[9] === 0x45 &&
			input[10] === 0x42 &&
			input[11] === 0x50
		)
			return "webp";
	}
	// AVIF / HEIF: "ftyp" at offset 4, brand at offset 8
	if (
		input[4] === 0x66 &&
		input[5] === 0x74 &&
		input[6] === 0x79 &&
		input[7] === 0x70
	) {
		const brand = String.fromCharCode(input[8], input[9], input[10], input[11]);
		if (brand === "avif" || brand === "avis") return "avif";
	}
	return undefined;
}

const tool: ToolDefinition = {
	id: "resize-image",
	name: "Resize Image",
	category: "image",
	description:
		"Resize images to specific dimensions. Supports all major image formats.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"image/avif",
	],
	inputExtensions: [
		".jpg",
		".jpeg",
		".png",
		".webp",
		".gif",
		".bmp",
		".tiff",
		".tif",
		".avif",
	],
	options: [
		{
			name: "width",
			type: "number",
			description: "Target width in pixels",
			min: 1,
			max: 16384,
		},
		{
			name: "height",
			type: "number",
			description: "Target height in pixels",
			min: 1,
			max: 16384,
		},
		{
			name: "fit",
			type: "string",
			description: "How to fit the image within the target dimensions",
			default: "inside",
			choices: ["contain", "cover", "fill", "inside", "outside"],
		},
		{
			name: "format",
			type: "string",
			description: "Output format (defaults to same as input)",
			choices: ["jpg", "png", "webp", "avif"],
		},
		{
			name: "quality",
			type: "number",
			description: "Output quality for lossy formats (1-100)",
			default: 80,
			min: 1,
			max: 100,
		},
	],
	execute: async (input, options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for image resizing");
		}
		const { imageBackend, onProgress } = context;
		const width = options.width as number | undefined;
		const height = options.height as number | undefined;

		if (!width && !height) {
			throw new Error("At least one of --width or --height must be specified");
		}

		const fit =
			(options.fit as "contain" | "cover" | "fill" | "inside" | "outside") ??
			"inside";
		// `format` documents itself as "defaults to same as input"; honor that
		// by sniffing the input bytes when the option isn't supplied.
		const outputFormat =
			(options.format as string) ?? sniffImageFormat(input) ?? "png";
		const quality = (options.quality as number) ?? 80;

		onProgress?.(10);
		const decoded = await imageBackend.decode(input, "auto");
		onProgress?.(30);
		const resized = await imageBackend.resize(decoded, {
			width,
			height,
			fit,
		});
		onProgress?.(70);
		const output = await imageBackend.encode(resized, {
			format: outputFormat,
			quality,
		});
		onProgress?.(100);

		const ext = FORMAT_TO_EXTENSION[outputFormat] ?? ".png";
		const mime = FORMAT_TO_MIME[outputFormat] ?? "image/png";

		return {
			output,
			extension: ext,
			mimeType: mime,
			metadata: {
				originalWidth: decoded.width,
				originalHeight: decoded.height,
				newWidth: resized.width,
				newHeight: resized.height,
			},
		};
	},
};

registerTool(tool);
export default tool;
