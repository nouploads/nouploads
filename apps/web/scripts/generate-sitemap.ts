#!/usr/bin/env npx tsx
/**
 * Generate sitemap.xml from the prerender list in react-router.config.ts.
 *
 * Run: npx tsx scripts/generate-sitemap.ts
 * Output: public/sitemap.xml
 *
 * This is run automatically as part of the build (see package.json).
 * The prerender list is the single source of truth for all public routes.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.VITE_SITE_URL || "https://nouploads.com";
const OUT_PATH = join(__dirname, "../public/sitemap.xml");

async function main() {
	// Import the config to get the prerender list
	const config = await import("../react-router.config.ts");
	const routes: string[] = config.default.prerender;

	if (!routes || routes.length === 0) {
		throw new Error("No prerender routes found in react-router.config.ts");
	}

	const today = new Date().toISOString().split("T")[0];

	const urls = routes
		.map((path) => {
			const loc = `${SITE_URL}${path}`;
			// Homepage gets highest priority, category pages next, tools lowest
			const priority =
				path === "/" ? "1.0" : path.split("/").length === 2 ? "0.8" : "0.6";
			return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
		})
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	writeFileSync(OUT_PATH, xml);
	console.log(`Generated sitemap.xml with ${routes.length} URLs → ${OUT_PATH}`);
}

main().catch((err) => {
	console.error("Failed to generate sitemap:", err);
	process.exit(1);
});
