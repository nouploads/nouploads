import { FORMAT_TO_EXTENSION, FORMAT_TO_MIME } from "../format-maps.js";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "crop-image",
	name: "Crop Image",
	category: "image",
	description: "Crop images to a specified region.",
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
			name: "x",
			type: "number",
			description: "Left offset in pixels",
			default: 0,
			min: 0,
		},
		{
			name: "y",
			type: "number",
			description: "Top offset in pixels",
			default: 0,
			min: 0,
		},
		{
			name: "width",
			type: "number",
			description: "Crop width in pixels",
			required: true,
			min: 1,
		},
		{
			name: "height",
			type: "number",
			description: "Crop height in pixels",
			required: true,
			min: 1,
		},
		{
			name: "format",
			type: "string",
			description: "Output format (defaults to png)",
			default: "png",
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
			throw new Error("Image backend required for image cropping");
		}
		const { imageBackend, onProgress } = context;

		const x = (options.x as number) ?? 0;
		const y = (options.y as number) ?? 0;
		const width = options.width as number | undefined;
		const height = options.height as number | undefined;

		if (!width || !height) {
			throw new Error("Both --width and --height are required for cropping");
		}

		const outputFormat = (options.format as string) ?? "png";
		const quality = (options.quality as number) ?? 80;

		onProgress?.(10);
		const decoded = await imageBackend.decode(input, "auto");
		onProgress?.(30);

		// Validate crop region fits within image
		if (x + width > decoded.width || y + height > decoded.height) {
			throw new Error(
				`Crop region (${x},${y} ${width}x${height}) exceeds image dimensions (${decoded.width}x${decoded.height})`,
			);
		}

		let cropped: typeof decoded;
		if (imageBackend.crop) {
			cropped = await imageBackend.crop(decoded, { x, y, width, height });
		} else {
			// Manual pixel crop fallback
			const out = new Uint8Array(width * height * 4);
			for (let row = 0; row < height; row++) {
				const srcOffset = ((y + row) * decoded.width + x) * 4;
				const dstOffset = row * width * 4;
				out.set(
					decoded.data.subarray(srcOffset, srcOffset + width * 4),
					dstOffset,
				);
			}
			cropped = { width, height, data: out };
		}
		onProgress?.(70);

		const output = await imageBackend.encode(cropped, {
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
				cropX: x,
				cropY: y,
				cropWidth: width,
				cropHeight: height,
			},
		};
	},
};

registerTool(tool);
export default tool;
