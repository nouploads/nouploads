export interface TextStats {
	characters: number;
	charactersNoSpaces: number;
	words: number;
	sentences: number;
	paragraphs: number;
	readingTime: string;
}

export function countCharacters(text: string): number {
	return text.length;
}

export function countCharactersNoSpaces(text: string): number {
	return text.replace(/\s/g, "").length;
}

export function countWords(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).filter(Boolean).length;
}

export function countSentences(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

export function countParagraphs(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0)
		.length;
}

export function estimateReadingTime(wordCount: number): string {
	if (wordCount === 0) return "0 min";
	const minutes = wordCount / 238;
	if (minutes < 1) return "< 1 min";
	return `~${Math.round(minutes)} min`;
}

export function analyzeText(text: string): TextStats {
	const words = countWords(text);
	return {
		characters: countCharacters(text),
		charactersNoSpaces: countCharactersNoSpaces(text),
		words,
		sentences: countSentences(text),
		paragraphs: countParagraphs(text),
		readingTime: estimateReadingTime(words),
	};
}
