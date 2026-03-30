import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "favicon-generator",
	name: "Favicon Generator",
	category: "image",
	description:
		"Generate multi-size .ico favicon files from any image. Packs 16x16, 32x32, and 48x48 sizes into a single ICO file.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"image/avif",
		"image/svg+xml",
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
		".svg",
	],
	options: [
		{
			name: "sizes",
			type: "string",
			description: "Comma-separated icon sizes in pixels (default: 16,32,48)",
			default: "16,32,48",
		},
	],
	execute: async (input, _options, context) => {
		if (!context.imageBackend) {
			throw new Error("Image backend required for favicon generation");
		}

		const { imageBackend, onProgress } = context;

		onProgress?.(10);
		const decoded = await imageBackend.decode(input, "auto");
		onProgress?.(30);

		const sizes = [16, 32, 48];
		const pngBuffers: Uint8Array[] = [];

		for (let i = 0; i < sizes.length; i++) {
			const size = sizes[i];
			const resized = await imageBackend.resize(decoded, {
				width: size,
				height: size,
				fit: "cover",
			});
			const png = await imageBackend.encode(resized, {
				format: "png",
				quality: 100,
			});
			pngBuffers.push(png);
			onProgress?.(30 + ((i + 1) / sizes.length) * 60);
		}

		// Pack into ICO format
		const headerSize = 6;
		const dirEntrySize = 16;
		const dirSize = dirEntrySize * pngBuffers.length;
		const dataOffset = headerSize + dirSize;

		let totalSize = dataOffset;
		for (const buf of pngBuffers) totalSize += buf.length;

		const result = new Uint8Array(totalSize);
		const view = new DataView(result.buffer);

		view.setUint16(0, 0, true);
		view.setUint16(2, 1, true);
		view.setUint16(4, pngBuffers.length, true);

		let offset = dataOffset;
		for (let i = 0; i < pngBuffers.length; i++) {
			const dirOffset = headerSize + i * dirEntrySize;
			result[dirOffset] = sizes[i] < 256 ? sizes[i] : 0;
			result[dirOffset + 1] = sizes[i] < 256 ? sizes[i] : 0;
			result[dirOffset + 2] = 0;
			result[dirOffset + 3] = 0;
			view.setUint16(dirOffset + 4, 1, true);
			view.setUint16(dirOffset + 6, 32, true);
			view.setUint32(dirOffset + 8, pngBuffers[i].length, true);
			view.setUint32(dirOffset + 12, offset, true);

			result.set(pngBuffers[i], offset);
			offset += pngBuffers[i].length;
		}

		onProgress?.(100);

		return {
			output: result,
			extension: ".ico",
			mimeType: "image/x-icon",
			metadata: {
				sizes: sizes.map((s) => `${s}x${s}`),
				originalWidth: decoded.width,
				originalHeight: decoded.height,
			},
		};
	},
};

registerTool(tool);
export default tool;
