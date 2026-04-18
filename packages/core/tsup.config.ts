import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts", "src/load-all-tools.ts", "src/tools/*.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	sourcemap: true,
	// Preserve the directory structure so dist/tools/* mirrors src/tools/*,
	// which lets package.json's "./tools/*" subpath export map cleanly.
	outDir: "dist",
});
