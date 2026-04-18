// Register this tool's ToolDefinition with the core registry. Required
// because core's main entry no longer eagerly loads every tool —
// @nouploads/core/tools/reorder-pdf self-registers on import.
import "@nouploads/core/tools/reorder-pdf";
import { getTool, isToolResultMulti } from "@nouploads/core";

/**
 * Reorder pages of a PDF according to the given 0-based page indices.
 * Pages not included in the order array are effectively removed.
 *
 * Delegates to @nouploads/core's reorder-pdf tool. Core's contract takes a
 * 1-based comma-separated string ("3,1,2,5,4"); the web component passes
 * 0-based indices, so this adapter translates.
 */
export async function reorderPdf(
	input: Uint8Array,
	pageOrder: number[],
	signal?: AbortSignal,
): Promise<Uint8Array> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const tool = getTool("reorder-pdf");
	if (!tool) throw new Error("reorder-pdf tool not found in core registry");

	if (pageOrder.length === 0) throw new Error("Page order cannot be empty");

	const orderStr = pageOrder.map((i) => i + 1).join(",");

	const result = await tool.execute(input, { order: orderStr }, { signal });

	if (isToolResultMulti(result)) {
		throw new Error("reorder-pdf unexpectedly returned multiple outputs");
	}

	return result.output;
}
