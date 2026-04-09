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

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.VITE_SITE_URL || "https://nouploads.com";
const OUT_PATH = join(__dirname, "../public/sitemap.xml");
const APP_DIR = join(__dirname, "..");

/**
 * Get the last git-modified date for the route file corresponding to a URL path.
 * Falls back to today's date if git log returns nothing.
 */
function getLastModified(routePath: string): string {
	const today = new Date().toISOString().split("T")[0];

	// Map URL path to route file
	let filePath: string;
	if (routePath === "/") {
		filePath = "app/routes/home.tsx";
	} else {
		const parts = routePath.split("/").filter(Boolean);
		if (parts.length === 1) {
			filePath = `app/routes/${parts[0]}/index.tsx`;
		} else {
			filePath = `app/routes/${parts.join("/")}.tsx`;
		}
	}

	try {
		const result = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
			cwd: APP_DIR,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		if (result) {
			return result.split("T")[0];
		}
	} catch {
		// git not available or file not tracked
	}

	return today;
}

async function main() {
	// Import the config to get the prerender list
	const config = await import("../react-router.config");
	const routes: string[] = config.default.prerender;

	if (!routes || routes.length === 0) {
		throw new Error("No prerender routes found in react-router.config.ts");
	}

	const urls = routes
		.map((path) => {
			const loc = `${SITE_URL}${path}`;
			const lastmod = getLastModified(path);
			return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
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
