/**
 * Classic lorem ipsum generator. Single source of truth for web and CLI.
 * Zero dependencies. Sync.
 */

import { registerTool } from "../registry.js";
import type { ToolDefinition } from "../tool.js";

/**
 * Classic Latin sentences drawn from Cicero's "De Finibus Bonorum et Malorum"
 * and the traditional lorem ipsum corpus used in typesetting since the 1500s.
 */
const SENTENCES = [
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
	"Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
	"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
	"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
	"Curabitur pretium tincidunt lacus nunc pellentesque.",
	"Nulla facilisi etiam dignissim diam quis enim lobortis scelerisque.",
	"Vitae congue eu consequat ac felis donec et odio pellentesque.",
	"Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
	"Sed faucibus turpis in eu mi bibendum neque egestas congue.",
	"Amet consectetur adipiscing elit ut aliquam purus sit amet luctus.",
	"Turpis egestas integer eget aliquet nibh praesent tristique magna.",
	"Viverra accumsan in nisl nisi scelerisque eu ultrices vitae auctor.",
	"Neque ornare aenean euismod elementum nisi quis eleifend quam.",
	"Viverra justo nec ultrices dui sapien eget mi proin sed.",
	"Feugiat in ante metus dictum at tempor commodo ullamcorper.",
	"Nunc sed augue lacus viverra vitae congue eu consequat.",
	"In hac habitasse platea dictumst vestibulum rhoncus est pellentesque.",
	"Egestas dui id ornare arcu odio ut sem nulla pharetra.",
	"Velit dignissim sodales ut eu sem integer vitae justo eget.",
	"Amet risus nullam eget felis eget nunc lobortis mattis aliquam.",
	"Faucibus pulvinar elementum integer enim neque volutpat ac tincidunt.",
	"Egestas maecenas pharetra convallis posuere morbi leo urna molestie.",
	"Nibh cras pulvinar mattis nunc sed blandit libero volutpat.",
	"Urna id volutpat lacus laoreet non curabitur gravida arcu.",
	"Amet volutpat consequat mauris nunc congue nisi vitae suscipit.",
	"Sagittis vitae et leo duis ut diam quam nulla porttitor.",
	"Tortor dignissim convallis aenean et tortor at risus viverra.",
	"Non sodales neque sodales ut etiam sit amet nisl purus.",
	"Arcu cursus euismod quis viverra nibh cras pulvinar mattis.",
	"Fames ac turpis egestas sed tempus urna et pharetra pharetra.",
	"Morbi tincidunt augue interdum velit euismod in pellentesque massa.",
	"Eu feugiat pretium nibh ipsum consequat nisl vel pretium lectus.",
	"Nulla porttitor massa id neque aliquam vestibulum morbi blandit.",
	"Tempus quam pellentesque nec nam aliquam sem et tortor consequat.",
	"Volutpat blandit aliquam etiam erat velit scelerisque in dictum.",
	"Hendrerit gravida rutrum quisque non tellus orci ac auctor augue.",
	"At elementum eu facilisis sed odio morbi quis commodo odio.",
	"Facilisis magna etiam tempor orci eu lobortis elementum nibh tellus.",
	"Sodales ut eu sem integer vitae justo eget magna fermentum.",
	"Sit amet nisl suscipit adipiscing bibendum est ultricies integer quis.",
	"Etiam erat velit scelerisque in dictum non consectetur a erat.",
	"Ornare massa eget egestas purus viverra accumsan in nisl nisi.",
	"Tincidunt vitae semper quis lectus nulla at volutpat diam ut.",
	"Bibendum at varius vel pharetra vel turpis nunc eget lorem.",
	"Auctor eu augue ut lectus arcu bibendum at varius vel.",
	"Malesuada pellentesque elit eget gravida cum sociis natoque penatibus.",
	"Nunc sed id semper risus in hendrerit gravida rutrum quisque.",
];

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function buildParagraph(sentenceCount: number): string {
	const result: string[] = [];
	for (let i = 0; i < sentenceCount; i++) result.push(pickRandom(SENTENCES));
	return result.join(" ");
}

export function generateParagraphs(
	count: number,
	classicStart: boolean,
): string {
	if (count <= 0) return "";
	const paragraphs: string[] = [];
	for (let i = 0; i < count; i++) {
		const sentenceCount = 4 + Math.floor(Math.random() * 5);
		let para = buildParagraph(sentenceCount);
		if (classicStart && i === 0) {
			const classic = SENTENCES[0];
			if (!para.startsWith(classic)) para = `${classic} ${para}`;
		}
		paragraphs.push(para);
	}
	return paragraphs.join("\n\n");
}

export function generateSentences(
	count: number,
	classicStart: boolean,
): string {
	if (count <= 0) return "";
	const result: string[] = [];
	for (let i = 0; i < count; i++) {
		if (classicStart && i === 0) result.push(SENTENCES[0]);
		else result.push(pickRandom(SENTENCES));
	}
	return result.join(" ");
}

export function generateWords(count: number, classicStart: boolean): string {
	if (count <= 0) return "";
	const pool: string[] = [];
	for (const s of SENTENCES) {
		for (const w of s.replace(/[.,]/g, "").split(/\s+/)) {
			pool.push(w.toLowerCase());
		}
	}

	const words: string[] = [];
	if (classicStart) {
		const classicWords = SENTENCES[0]
			.replace(/[.,]/g, "")
			.split(/\s+/)
			.map((w) => w.toLowerCase());
		for (let i = 0; i < Math.min(count, classicWords.length); i++) {
			words.push(classicWords[i]);
		}
	}
	while (words.length < count) words.push(pickRandom(pool));

	if (words.length > 0) {
		words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
	}

	return words.slice(0, count).join(" ");
}

export function countWords(text: string): number {
	if (!text.trim()) return 0;
	return text.trim().split(/\s+/).length;
}

export function countChars(text: string): number {
	return text.length;
}

const tool: ToolDefinition = {
	id: "lorem-ipsum",
	name: "Lorem Ipsum Generator",
	category: "developer",
	description: "Generate placeholder text with configurable length and format.",
	inputMimeTypes: ["text/plain"],
	inputExtensions: [".txt"],
	options: [
		{
			name: "mode",
			type: "string",
			description: "Output mode: paragraphs, sentences, or words",
			default: "paragraphs",
			choices: ["paragraphs", "sentences", "words"],
		},
		{
			name: "count",
			type: "number",
			description: "Number of paragraphs, sentences, or words to generate",
			default: 5,
			min: 1,
			max: 100,
		},
		{
			name: "classicStart",
			type: "boolean",
			description:
				'Whether to start output with the classic "Lorem ipsum dolor sit amet"',
			default: true,
		},
	],
	execute: async (_input, options, _context) => {
		const mode = (options.mode as string) || "paragraphs";
		const count = Math.min(Math.max(1, (options.count as number) || 5), 100);
		const classicStart = options.classicStart !== false;
		let text: string;
		if (mode === "sentences") text = generateSentences(count, classicStart);
		else if (mode === "words") text = generateWords(count, classicStart);
		else text = generateParagraphs(count, classicStart);
		return {
			output: new TextEncoder().encode(text),
			extension: ".txt",
			mimeType: "text/plain",
			metadata: { mode, count, classicStart },
		};
	},
};

registerTool(tool);
export default tool;
