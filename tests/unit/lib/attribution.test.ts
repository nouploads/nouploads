import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BROWSER_APIS, PACKAGES } from "~/lib/attribution";

const pkgJson = JSON.parse(
	readFileSync(resolve(__dirname, "../../../package.json"), "utf-8"),
);
const allDeps: Record<string, string> = {
	...pkgJson.dependencies,
	...pkgJson.devDependencies,
};

describe("attribution registry", () => {
	it("every PACKAGES entry corresponds to an installed npm dependency", () => {
		for (const pkgName of Object.keys(PACKAGES)) {
			expect(
				allDeps,
				`"${pkgName}" is in PACKAGES but not in package.json`,
			).toHaveProperty(pkgName);
		}
	});

	it("every PACKAGES entry has a valid GitHub URL", () => {
		for (const [pkgName, meta] of Object.entries(PACKAGES)) {
			expect(meta.repoUrl, `${pkgName} repoUrl`).toMatch(
				/^https:\/\/github\.com\//,
			);
		}
	});

	it("every PACKAGES entry has a non-empty license", () => {
		for (const [pkgName, meta] of Object.entries(PACKAGES)) {
			expect(meta.license, `${pkgName} license`).toBeTruthy();
		}
	});

	it("every BROWSER_APIS entry has a valid MDN URL", () => {
		for (const [apiName, meta] of Object.entries(BROWSER_APIS)) {
			expect(meta.mdnUrl, `${apiName} mdnUrl`).toMatch(
				/^https:\/\/developer\.mozilla\.org\//,
			);
		}
	});

	it("every PACKAGES entry has a non-empty name", () => {
		for (const [pkgName, meta] of Object.entries(PACKAGES)) {
			expect(meta.name, `${pkgName} name`).toBeTruthy();
		}
	});
});
