import { FORMAT_TO_EXTENSION, FORMAT_TO_MIME } from "../format-maps.js";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

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
		const outputFormat = (options.format as string) ?? "png";
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
