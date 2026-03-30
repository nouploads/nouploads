import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import sitemap from "vite-plugin-sitemap";
import tsconfigPaths from "vite-tsconfig-paths";

const rootPkg = JSON.parse(
	readFileSync(resolve(import.meta.dirname!, "../../package.json"), "utf8"),
);

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(rootPkg.version),
	},
	worker: {
		format: "es",
	},
	optimizeDeps: {
		exclude: ["@jsquash/avif", "jxl-oxide-wasm"],
	},
	plugins: [
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		sitemap({
			hostname: process.env.VITE_SITE_URL || "https://nouploads.com",
			outDir: "build/client",
			generateRobotsTxt: false,
		}),
	],
});
