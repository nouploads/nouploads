#!/usr/bin/env node
/**
 * Lighthouse CI — runs Lighthouse 13 against prerendered static build.
 *
 * Uses `serve` for static files (lhci's built-in server and bare
 * http.createServer both cause false-negative SEO audits due to
 * missing clean-URL redirects / content negotiation).
 */
import lighthouseFn from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = (await import(resolve(__dirname, "../lighthouserc.cjs"))).default;

const STATIC_DIR = resolve(__dirname, "..", config.ci.collect.staticDistDir);
const URLS = config.ci.collect.url;
const ASSERTIONS = config.ci.assert.assertions;

// Start `serve` on a random port
const port = 10000 + Math.floor(Math.random() * 50000);
const serveBin = resolve(__dirname, "../node_modules/.bin/serve");
const serveProc = spawn(serveBin, [STATIC_DIR, "-l", String(port), "--no-clipboard"], {
	stdio: ["ignore", "pipe", "pipe"],
});

// Wait for server to be ready
await new Promise((resolve, reject) => {
	const timeout = setTimeout(() => reject(new Error("serve startup timeout")), 15000);
	const handler = (data) => {
		if (data.toString().includes("Accepting connections")) {
			clearTimeout(timeout);
			resolve();
		}
	};
	serveProc.stdout.on("data", handler);
	serveProc.stderr.on("data", handler);
});
console.log(`Static server on port ${port}`);

// Launch Chrome
const chrome = await chromeLauncher.launch({
	chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});
console.log(`Chrome on port ${chrome.port}\n`);

const failures = [];

for (const urlTemplate of URLS) {
	// Convert /index.html URLs to clean URLs (serve redirects index.html → /)
	const url = urlTemplate
		.replace("http://localhost", `http://localhost:${port}`)
		.replace(/\/index\.html$/, "/");
	const shortUrl = url.replace(`http://localhost:${port}`, "") || "/";
	process.stdout.write(`${shortUrl}  `);

	const result = await lighthouseFn(url, {
		port: chrome.port,
		output: "json",
		logLevel: "error",
		onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
	});

	const report = result.lhr;

	for (const [assertion, [level, { minScore }]] of Object.entries(ASSERTIONS)) {
		const category = assertion.replace("categories:", "");
		const score = report.categories[category]?.score;
		if (score == null) continue;

		if (score < minScore) {
			process.stdout.write(`✘ ${category}:${score} `);
			if (level === "error") {
				failures.push(`${shortUrl} ${category}: ${score} < ${minScore}`);
				for (const ref of report.categories[category].auditRefs) {
					const a = report.audits[ref.id];
					if (a?.score !== null && a?.score < 1 && ref.weight > 0) {
						failures.push(`  ↳ ${ref.id} (weight:${ref.weight}, score:${a.score})`);
					}
				}
			}
		} else {
			process.stdout.write(`✓ ${category}:${score} `);
		}
	}
	console.log();
}

await chrome.kill();
serveProc.kill();

if (failures.length > 0) {
	console.log(`\n✘ Failures:`);
	for (const f of failures) console.log(`  ${f}`);
	process.exit(1);
}

console.log("\n✓ All Lighthouse assertions passed.");
