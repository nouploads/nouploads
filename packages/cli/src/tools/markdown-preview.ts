/**
 * Re-export of @nouploads/core/tools/markdown-preview.
 * Importing this module triggers the underlying registerTool() side
 * effect — listed in package.json sideEffects so bundlers preserve it.
 */
export * from "@nouploads/core/tools/markdown-preview";
export { default } from "@nouploads/core/tools/markdown-preview";
