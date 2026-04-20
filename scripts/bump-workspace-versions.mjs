#!/usr/bin/env node
/**
 * Writes a new version string to the root package.json and every
 * workspace package.json (keeps all five in lockstep). Dependency
 * references that use `workspace:*` stay untouched — pnpm rewrites
 * those at publish time to the actual published version.
 *
 * Usage:
 *   node scripts/bump-workspace-versions.mjs 0.4.1
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+([-.+].*)?$/.test(newVersion)) {
	console.error("Usage: bump-workspace-versions.mjs <semver>");
	process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Every package.json we version in lockstep. Matches the former
// Changesets `fixed` group — the root stays listed so the top-level
// package.json also tracks the release version.
const targets = [
	"package.json",
	"apps/web/package.json",
	"packages/core/package.json",
	"packages/cli/package.json",
	"packages/backend-canvas/package.json",
	"packages/backend-sharp/package.json",
];

for (const rel of targets) {
	const abs = join(repoRoot, rel);
	const pkg = JSON.parse(readFileSync(abs, "utf8"));
	pkg.version = newVersion;
	writeFileSync(abs, `${JSON.stringify(pkg, null, "\t")}\n`);
	console.log(`  ${rel} → ${newVersion}`);
}
