/**
 * Re-export of @nouploads/core/tools/jwt-decoder.
 * Importing this module triggers the underlying registerTool() side
 * effect — listed in package.json sideEffects so bundlers preserve it.
 */
export * from "@nouploads/core/tools/jwt-decoder";
export { default } from "@nouploads/core/tools/jwt-decoder";
