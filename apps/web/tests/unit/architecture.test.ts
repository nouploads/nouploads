import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEATURES_DIR = path.resolve(__dirname, "../../app/features");

/**
 * Snapshot of web processors that DO NOT YET delegate to @nouploads/core, taken
 * 2026-04-17 right after Phase 0 of the single-source-of-truth migration. Each
 * entry is grandfathered: the architecture test ignores it. Migrating a tool
 * means removing it from this set in the same PR. Adding a NEW processor file
 * that doesn't delegate to core fails the test below.
 *
 * The set should only ever shrink. See MIGRATION_TRACKER.md for context.
 */
/**
 * Phase 5 finished 2026-04-19 — every web processor declares a core
 * dependency (real delegation or type-only for browser-only tools).
 * The exempt list is empty and must stay that way; any new entry is a
 * regression in the single-source-of-truth contract.
 */
const CORE_DELEGATION_EXEMPT = new Set<string>([]);

function findProcessorFiles(): string[] {
	const result: string[] = [];
	for (const category of readdirSync(FEATURES_DIR)) {
		const procDir = path.join(FEATURES_DIR, category, "processors");
		const stat = statSync(procDir, { throwIfNoEntry: false });
		if (!stat?.isDirectory()) continue;
		for (const file of readdirSync(procDir)) {
			if (!file.endsWith(".ts") || file.endsWith(".worker.ts")) continue;
			result.push(`${category}/processors/${file}`);
		}
	}
	return result.sort();
}

describe("Architecture: web processors must delegate to @nouploads/core", () => {
	const processors = findProcessorFiles();

	it("snapshot has at least 55 primary processors (catches accidental loss)", () => {
		expect(processors.length).toBeGreaterThanOrEqual(55);
	});

	it("every processor either delegates to core or is in the exempt grandfather list", () => {
		const violations: string[] = [];
		for (const relPath of processors) {
			if (CORE_DELEGATION_EXEMPT.has(relPath)) continue;
			const src = readFileSync(path.join(FEATURES_DIR, relPath), "utf8");
			if (!/from\s+["']@nouploads\/core(\/[^"']+)?["']/.test(src)) {
				violations.push(relPath);
			}
		}
		expect(
			violations,
			`These processors don't import @nouploads/core. Either add the delegation to core (preferred) or — only with strong justification, see MIGRATION_TRACKER.md — add the path to CORE_DELEGATION_EXEMPT in apps/web/tests/unit/architecture.test.ts:`,
		).toEqual([]);
	});

	it("exempt list contains no stale entries (i.e. no longer-forked files still listed)", () => {
		const stillForked = new Set(processors);
		const stale: string[] = [];
		for (const exempt of CORE_DELEGATION_EXEMPT) {
			if (!stillForked.has(exempt)) {
				stale.push(exempt);
			} else {
				const src = readFileSync(path.join(FEATURES_DIR, exempt), "utf8");
				if (/from\s+["']@nouploads\/core(\/[^"']+)?["']/.test(src)) {
					stale.push(`${exempt} (now delegates — remove from exempt list)`);
				}
			}
		}
		expect(
			stale,
			"Remove these stale entries from CORE_DELEGATION_EXEMPT:",
		).toEqual([]);
	});
});
