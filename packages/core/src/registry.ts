import type { ToolDefinition } from "./tool.js";

const tools = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
	if (tools.has(tool.id)) {
		throw new Error(`Tool already registered: ${tool.id}`);
	}
	tools.set(tool.id, tool);
}

export function getTool(id: string): ToolDefinition | undefined {
	return tools.get(id);
}

export function getAllTools(): ToolDefinition[] {
	return Array.from(tools.values());
}

export function getToolsByCategory(category: string): ToolDefinition[] {
	return getAllTools().filter((t) => t.category === category);
}

/**
 * Find a tool by from/to format pair.
 * This is the primary lookup path for CLI: `nouploads heic jpg` -> find tool with from=heic, to=jpg
 */
export function findToolByFormats(
	from: string,
	to: string,
): ToolDefinition | undefined {
	return getAllTools().find(
		(t) =>
			t.from?.toLowerCase() === from.toLowerCase() &&
			t.to?.toLowerCase() === to.toLowerCase(),
	);
}
