/**
 * Case conversion utilities — the single source of truth for text case
 * transformations used by both the web app (developer-tools) and the CLI.
 *
 * Zero dependencies. Pure string manipulation. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

export type CaseStyle =
	| "upper"
	| "lower"
	| "title"
	| "sentence"
	| "camel"
	| "pascal"
	| "snake"
	| "kebab"
	| "constant"
	| "dot";

/**
 * Split text into words on spaces, hyphens, underscores, dots, and
 * camelCase/PascalCase boundaries.
 */
export function splitWords(input: string): string[] {
	if (!input) return [];
	const separated = input
		.replace(/([a-z])([A-Z])/g, "$1\0$2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2");
	return separated.split(/[\s\-_.\0]+/).filter((w) => w.length > 0);
}

export function toUpperCase(input: string): string {
	return input.toUpperCase();
}

export function toLowerCase(input: string): string {
	return input.toLowerCase();
}

export function toTitleCase(input: string): string {
	return splitWords(input)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
}

export function toSentenceCase(input: string): string {
	const words = splitWords(input);
	if (words.length === 0) return "";
	return words
		.map((w, i) =>
			i === 0
				? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
				: w.toLowerCase(),
		)
		.join(" ");
}

export function toCamelCase(input: string): string {
	return splitWords(input)
		.map((w, i) =>
			i === 0
				? w.toLowerCase()
				: w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
		)
		.join("");
}

export function toPascalCase(input: string): string {
	return splitWords(input)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join("");
}

export function toSnakeCase(input: string): string {
	return splitWords(input)
		.map((w) => w.toLowerCase())
		.join("_");
}

export function toKebabCase(input: string): string {
	return splitWords(input)
		.map((w) => w.toLowerCase())
		.join("-");
}

export function toConstantCase(input: string): string {
	return splitWords(input)
		.map((w) => w.toUpperCase())
		.join("_");
}

export function toDotCase(input: string): string {
	return splitWords(input)
		.map((w) => w.toLowerCase())
		.join(".");
}

const converters: Record<CaseStyle, (input: string) => string> = {
	upper: toUpperCase,
	lower: toLowerCase,
	title: toTitleCase,
	sentence: toSentenceCase,
	camel: toCamelCase,
	pascal: toPascalCase,
	snake: toSnakeCase,
	kebab: toKebabCase,
	constant: toConstantCase,
	dot: toDotCase,
};

export function convertCase(input: string, targetCase: string): string {
	const fn = converters[targetCase as CaseStyle];
	if (!fn) throw new Error(`Unknown case style: ${targetCase}`);
	return fn(input);
}

/** UI display metadata for all available case styles. */
export const CASE_STYLES: {
	value: CaseStyle;
	label: string;
	example: string;
}[] = [
	{ value: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
	{ value: "lower", label: "lowercase", example: "hello world" },
	{ value: "title", label: "Title Case", example: "Hello World" },
	{ value: "sentence", label: "Sentence case", example: "Hello world" },
	{ value: "camel", label: "camelCase", example: "helloWorld" },
	{ value: "pascal", label: "PascalCase", example: "HelloWorld" },
	{ value: "snake", label: "snake_case", example: "hello_world" },
	{ value: "kebab", label: "kebab-case", example: "hello-world" },
	{ value: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
	{ value: "dot", label: "dot.case", example: "hello.world" },
];

const tool: ToolDefinition = {
	id: "case-converter",
	name: "Case Converter",
	category: "developer",
	description:
		"Convert text between camelCase, snake_case, kebab-case, and more.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "case",
			type: "string",
			description: "Target case style",
			default: "camel",
			choices: CASE_STYLES.map((s) => s.value),
		},
	],
	execute: async (input, options, _context) => {
		const style = (options.case as string) || "camel";
		const text = new TextDecoder().decode(input);
		const result = convertCase(text, style);
		return {
			output: new TextEncoder().encode(result),
			extension: ".txt",
			mimeType: "text/plain",
			metadata: { case: style },
		};
	},
};

registerTool(tool);
export default tool;
