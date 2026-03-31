/**
 * Case conversion utilities.
 * Splits text on word boundaries and rejoins with the target convention.
 * Zero dependencies — pure string manipulation.
 */

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
 * Split text into words on spaces, hyphens, underscores, dots,
 * and camelCase/PascalCase boundaries (a-z followed by A-Z, or
 * a run of uppercase followed by an uppercase+lowercase pair).
 */
export function splitWords(input: string): string[] {
	if (!input) return [];

	// Step 1: Insert a separator at camelCase boundaries
	// "helloWorldExample" → "hello·World·Example"
	// "parseHTTPResponse" → "parse·HTTP·Response"
	const separated = input
		// Insert before uppercase letter preceded by a lowercase letter
		.replace(/([a-z])([A-Z])/g, "$1\0$2")
		// Insert before an uppercase letter followed by lowercase, when preceded by uppercase run
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1\0$2");

	// Step 2: Split on whitespace, hyphens, underscores, dots, and the inserted separator
	const parts = separated.split(/[\s\-_.\0]+/);

	// Step 3: Filter out empty strings
	return parts.filter((w) => w.length > 0);
}

export function toUpperCase(input: string): string {
	return input.toUpperCase();
}

export function toLowerCase(input: string): string {
	return input.toLowerCase();
}

export function toTitleCase(input: string): string {
	const words = splitWords(input);
	return words
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
	const words = splitWords(input);
	return words
		.map((w, i) =>
			i === 0
				? w.toLowerCase()
				: w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
		)
		.join("");
}

export function toPascalCase(input: string): string {
	const words = splitWords(input);
	return words
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join("");
}

export function toSnakeCase(input: string): string {
	const words = splitWords(input);
	return words.map((w) => w.toLowerCase()).join("_");
}

export function toKebabCase(input: string): string {
	const words = splitWords(input);
	return words.map((w) => w.toLowerCase()).join("-");
}

export function toConstantCase(input: string): string {
	const words = splitWords(input);
	return words.map((w) => w.toUpperCase()).join("_");
}

export function toDotCase(input: string): string {
	const words = splitWords(input);
	return words.map((w) => w.toLowerCase()).join(".");
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
	if (!fn) {
		throw new Error(`Unknown case style: ${targetCase}`);
	}
	return fn(input);
}

/** All available case styles with display labels */
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
