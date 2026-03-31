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
		{
			name: "silence-well-known",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url?.startsWith("/.well-known/")) {
						res.statusCode = 404;
						res.setHeader("Content-Type", "application/json");
						res.end("{}");
						return;
					}
					next();
				});
			},
		},
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		sitemap({
			hostname: process.env.VITE_SITE_URL || "https://nouploads.com",
			outDir: "build/client",
			generateRobotsTxt: false,
			readable: true,
			changefreq: {
				"/": "weekly",
				"/about": "monthly",
				"/image": "weekly",
				"/pdf": "weekly",
				"/vector": "weekly",
				"/developer": "weekly",
				"*": "monthly",
			},
			priority: {
				"/": 1.0,
				"/image": 0.9,
				"/pdf": 0.9,
				"/vector": 0.9,
				"/developer": 0.9,
				"/about": 0.3,
				"/image/convert": 0.8,
				"/image/compress": 0.8,
				"/image/resize": 0.8,
				"/image/crop": 0.8,
				"/image/heic-to-jpg": 0.8,
				"/pdf/merge": 0.8,
				"/pdf/split": 0.8,
				"/pdf/compress": 0.8,
				"*": 0.6,
			},
		}),
	],
});
