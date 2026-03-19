import Fuse, { type IFuseOptions } from "fuse.js";

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
	threshold: 0.4,
	ignoreLocation: true,
};

export function createToolSearcher(tools: Tool[]) {
	return new Fuse(tools, fuseOptions);
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
