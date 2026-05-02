/**
 * Re-export of @nouploads/core/load-all-tools.
 * Library consumers call this once to register every tool in the catalog
 * so that getAllTools(), getTool(id), findToolByFormats(...) all work.
 *
 *   import { loadAllTools } from "nouploads/load-all-tools";
 *   await loadAllTools();
 *
 * If you only need a few tools, import them individually instead — that
 * keeps the bundle small:
 *
 *   import "nouploads/tools/rotate-image";
 */
export { loadAllTools } from "@nouploads/core/load-all-tools";
