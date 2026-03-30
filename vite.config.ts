import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import sitemap from "vite-plugin-sitemap";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
			hostname: "https://nouploads.com",
			outDir: "build/client",
			generateRobotsTxt: false,
		}),
	],
});
