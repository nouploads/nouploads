import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/cli.ts"],
	format: ["esm"],
	dts: { resolve: true },
	clean: true,
	sourcemap: false,
	// Inline workspace deps including any subpath imports like
	// `@nouploads/core/load-all-tools` or `@nouploads/core/tools/<id>`.
	// A regex is required — bare-string matches only the exact specifier.
	noExternal: [/^@nouploads\//],
});
