/**
 * Smoke tests for every browser-only tool stub. These tools can't
 * execute in Node — the test's only job is to confirm each one is
 * registered, declares `browser` capability, and fails loudly with a
 * recognisable message if someone tries to run it server-side.
 *
 * The web adapters for these tools keep a type-only `import type {}`
 * reference to the stub module (see `apps/web/tests/unit/architecture.test.ts`),
 * so renaming or deleting a stub without updating the web side will be
 * caught by the architecture drift test.
 */
import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import "../src/tools/browser-only-stubs.js";

const BROWSER_ONLY_IDS = [
	"remove-background",
	"parse-gif-frames",
	"compress-gif",
	"convert-vector",
	"pdf-to-jpg",
	"pdf-to-png",
	"compress-pdf",
] as const;

describe("browser-only-stubs", () => {
	for (const id of BROWSER_ONLY_IDS) {
		describe(id, () => {
			it("is registered", () => {
				expect(getTool(id)).toBeDefined();
			});

			it('declares "browser" capability', () => {
				expect(getTool(id)?.capabilities).toContain("browser");
			});

			it("throws on Node execute() with a recognisable message", async () => {
				const tool = getTool(id);
				if (!tool) throw new Error(`${id} not registered`);
				await expect(tool.execute(new Uint8Array([0]), {}, {})).rejects.toThrow(
					/browser environment/,
				);
			});
		});
	}
});
