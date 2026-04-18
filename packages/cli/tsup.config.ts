import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/cli.ts"],
	format: ["esm"],
	dts: { resolve: true },
	clean: true,
	sourcemap: false,
	noExternal: ["@nouploads/core", "@nouploads/backend-sharp"],
});
