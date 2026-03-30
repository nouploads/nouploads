import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "watermark-image",
	name: "Image Watermark",
	category: "image",
	description:
		"Add a text watermark overlay to images. Supports centered or tiled placement.",
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
			name: "text",
			type: "string",
			description: "Watermark text",
			default: "SAMPLE",
		},
		{
			name: "fontSize",
			type: "number",
			description: "Font size in pixels",
			default: 48,
			min: 12,
			max: 200,
		},
		{
			name: "opacity",
			type: "number",
			description: "Watermark opacity (0.1-1.0)",
			default: 0.3,
			min: 0.1,
			max: 1.0,
		},
		{
			name: "rotation",
			type: "number",
			description: "Rotation in degrees",
			default: -30,
			min: -90,
			max: 90,
		},
		{
			name: "color",
			type: "string",
			description: "Watermark color as hex",
			default: "#000000",
		},
		{
			name: "mode",
			type: "string",
			description: "Placement mode: center or tiled",
			default: "center",
			choices: ["center", "tiled"],
		},
	],
	capabilities: ["browser"],
	execute: async (_input, _options, _context) => {
		throw new Error(
			"Watermark processing runs in the browser via Canvas API. Use the web processor instead.",
		);
	},
};

registerTool(tool);
export default tool;
