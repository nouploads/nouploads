import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";

export interface Tool {
	title: string;
	description: string;
	href: string;
	icon: string;
	iconColor: string;
	iconBg: string;
	comingSoon?: boolean;
	category?: string;
	categoryHref?: string;
}

const fuseOptions: IFuseOptions<Tool> = {
	keys: [
		{ name: "title", weight: 2 },
		{ name: "description", weight: 1 },
	],
	threshold: 0.2,
	ignoreLocation: true,
};

export function createToolSearcher(tools: Tool[]) {
	return new Fuse(tools, fuseOptions);
}

/**
 * Token-aware search: split query into words, search each independently,
 * return only tools that match ALL tokens (intersection). This handles
 * word-order differences like "gif compress" matching "Compress GIF".
 */
export function tokenSearch(
	fuse: Fuse<Tool>,
	query: string,
): FuseResult<Tool>[] {
	const tokens = query
		.trim()
		.split(/\s+/)
		.filter((t) => t.length > 0);
	if (tokens.length === 0) return [];
	if (tokens.length === 1) return fuse.search(tokens[0]);

	// Get results for each token, then intersect by href
	const perToken = tokens.map(
		(t) => new Map(fuse.search(t).map((r) => [r.item.href, r])),
	);
	// Start with the smallest result set for efficiency
	perToken.sort((a, b) => a.size - b.size);
	const base = perToken[0];
	const rest = perToken.slice(1);

	const intersected: FuseResult<Tool>[] = [];
	for (const [href, result] of base) {
		if (rest.every((m) => m.has(href))) {
			// Use the worst (highest) score across tokens as the combined score
			const worstScore = Math.max(
				result.score ?? 0,
				...rest.map((m) => m.get(href)?.score ?? 0),
			);
			intersected.push({ ...result, score: worstScore });
		}
	}
	return intersected.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
}

export function searchTools(
	fuse: Fuse<Tool>,
	query: string,
	allTools: Tool[],
): Tool[] {
	const q = query.trim();
	if (!q) return allTools;
	return fuse.search(q).map((r) => r.item);
}
