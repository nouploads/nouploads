/**
 * Re-export of @nouploads/core/tools/regex-tester.
 * Importing this module triggers the underlying registerTool() side
 * effect — listed in package.json sideEffects so bundlers preserve it.
 */
export * from "@nouploads/core/tools/regex-tester";
export { default } from "@nouploads/core/tools/regex-tester";
