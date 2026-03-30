import { FORMAT_TO_EXTENSION, FORMAT_TO_MIME } from "../format-maps.js";
import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "rotate-image",
	name: "Rotate/Flip Image",
	category: "image",
	description:
		"Rotate images by 90/180/270 degrees or flip horizontally/vertically.",
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
			name: "action",
			type: "string",
			description: "Rotation or flip action to apply",
			default: "rotate-cw",
			choices: ["rotate-cw", "rotate-ccw", "rotate-180", "flip-h", "flip-v"],
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
			throw new Error("Image backend required for image rotation");
		}
		const { imageBackend, onProgress } = context;

		const action = (options.action as string) ?? "rotate-cw";
		const outputFormat = (options.format as string) ?? "png";
		const quality = (options.quality as number) ?? 80;

		onProgress?.(10);
		const decoded = await imageBackend.decode(input, "auto");
		onProgress?.(30);

		const { width: srcW, height: srcH, data: srcData } = decoded;
		const swapDimensions = action === "rotate-cw" || action === "rotate-ccw";
		const outW = swapDimensions ? srcH : srcW;
		const outH = swapDimensions ? srcW : srcH;
		const out = new Uint8Array(outW * outH * 4);

		for (let y = 0; y < srcH; y++) {
			for (let x = 0; x < srcW; x++) {
				const srcIdx = (y * srcW + x) * 4;
				let dstX: number;
				let dstY: number;

				switch (action) {
					case "rotate-cw":
						dstX = srcH - 1 - y;
						dstY = x;
						break;
					case "rotate-ccw":
						dstX = y;
						dstY = srcW - 1 - x;
						break;
					case "rotate-180":
						dstX = srcW - 1 - x;
						dstY = srcH - 1 - y;
						break;
					case "flip-h":
						dstX = srcW - 1 - x;
						dstY = y;
						break;
					case "flip-v":
						dstX = x;
						dstY = srcH - 1 - y;
						break;
					default:
						dstX = x;
						dstY = y;
				}

				const dstIdx = (dstY * outW + dstX) * 4;
				out[dstIdx] = srcData[srcIdx];
				out[dstIdx + 1] = srcData[srcIdx + 1];
				out[dstIdx + 2] = srcData[srcIdx + 2];
				out[dstIdx + 3] = srcData[srcIdx + 3];
			}
		}
		onProgress?.(70);

		const rotated = { width: outW, height: outH, data: out };
		const output = await imageBackend.encode(rotated, {
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
				originalWidth: srcW,
				originalHeight: srcH,
				newWidth: outW,
				newHeight: outH,
				action,
			},
		};
	},
};

registerTool(tool);
export default tool;
