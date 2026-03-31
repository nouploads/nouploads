/**
 * CSS minification and beautification.
 * Uses only regex and string manipulation — zero dependencies.
 */

/** Max input size: 10 MB of raw CSS text */
export const MAX_CSS_SIZE = 10 * 1024 * 1024;

/**
 * Minify CSS by stripping comments, collapsing whitespace,
 * removing trailing semicolons before `}`, and trimming.
 */
export function minifyCss(input: string): string {
	// Strip block comments
	let result = input.replace(/\/\*[\s\S]*?\*\//g, "");
	// Collapse all whitespace to single spaces
	result = result.replace(/\s+/g, " ");
	// Remove spaces around structural characters
	result = result.replace(/\s*([{}:;,])\s*/g, "$1");
	// Remove trailing semicolons before closing braces
	result = result.replace(/;}/g, "}");
	return result.trim();
}

/**
 * Beautify CSS by tokenizing on `{`, `}`, `;` and rebuilding
 * with 2-space indentation, one property per line.
 */
export function beautifyCss(input: string): string {
	// Strip comments for clean tokenization
	let cleaned = input.replace(/\/\*[\s\S]*?\*\//g, "");
	// Collapse whitespace
	cleaned = cleaned.replace(/\s+/g, " ").trim();

	if (!cleaned) return "";

	let output = "";
	let indent = 0;
	const pad = () => "  ".repeat(indent);

	for (let i = 0; i < cleaned.length; i++) {
		const ch = cleaned[i];
		if (ch === "{") {
			output = output.trimEnd();
			output += " {\n";
			indent++;
		} else if (ch === "}") {
			output = output.trimEnd();
			if (!output.endsWith("\n")) {
				output += "\n";
			}
			indent = Math.max(0, indent - 1);
			output += `${pad()}}\n`;
		} else if (ch === ";") {
			output = output.trimEnd();
			output += ";\n";
		} else if (ch === ":") {
			output = output.trimEnd();
			output += ": ";
		} else if (ch === " " && output.endsWith("\n")) {
			// skip leading space after newline
		} else {
			if (output.endsWith("\n")) {
				output += pad();
			}
			output += ch;
		}
	}

	return output.trim();
}

export interface CssSavings {
	originalSize: number;
	outputSize: number;
	savingsPercent: number;
}

/**
 * Calculate size savings between original and output CSS strings.
 */
export function calculateSavings(original: string, output: string): CssSavings {
	const originalSize = new TextEncoder().encode(original).byteLength;
	const outputSize = new TextEncoder().encode(output).byteLength;
	const savingsPercent =
		originalSize > 0
			? Math.round(((originalSize - outputSize) / originalSize) * 100)
			: 0;
	return { originalSize, outputSize, savingsPercent };
}
