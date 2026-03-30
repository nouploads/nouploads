import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

const tool: ToolDefinition = {
	id: "image-filters",
	name: "Image Filters",
	category: "image",
	description:
		"Apply visual filters and effects to images — grayscale, sepia, blur, brightness, contrast, and more.",
	inputMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/bmp",
		"image/tiff",
		"image/avif",
	],
	inputExtensions: [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp"],
	options: [
		{
			name: "brightness",
			type: "number",
			description: "Brightness percentage (0-200, default 100)",
			default: 100,
			min: 0,
			max: 200,
		},
		{
			name: "contrast",
			type: "number",
			description: "Contrast percentage (0-200, default 100)",
			default: 100,
			min: 0,
			max: 200,
		},
		{
			name: "saturation",
			type: "number",
			description: "Saturation percentage (0-200, default 100)",
			default: 100,
			min: 0,
			max: 200,
		},
		{
			name: "blur",
			type: "number",
			description: "Blur radius in pixels (0-20, default 0)",
			default: 0,
			min: 0,
			max: 20,
		},
		{
			name: "hueRotate",
			type: "number",
			description: "Hue rotation in degrees (0-360, default 0)",
			default: 0,
			min: 0,
			max: 360,
		},
		{
			name: "grayscale",
			type: "number",
			description: "Grayscale percentage (0-100, default 0)",
			default: 0,
			min: 0,
			max: 100,
		},
		{
			name: "sepia",
			type: "number",
			description: "Sepia percentage (0-100, default 0)",
			default: 0,
			min: 0,
			max: 100,
		},
		{
			name: "invert",
			type: "number",
			description: "Invert percentage (0-100, default 0)",
			default: 0,
			min: 0,
			max: 100,
		},
		{
			name: "outputFormat",
			type: "string",
			description: "Output format (defaults to png)",
			default: "png",
			choices: ["jpg", "png", "webp"],
		},
	],
	capabilities: ["browser"],
	execute: async (): Promise<never> => {
		throw new Error(
			"Image Filters requires a browser environment with Canvas support. " +
				"Use the web app at https://nouploads.com for this tool.",
		);
	},
};

registerTool(tool);
export default tool;
