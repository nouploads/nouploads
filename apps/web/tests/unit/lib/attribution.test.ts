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

	it("every PACKAGES repoUrl matches the npm registry repository field", () => {
		// Extract "owner/repo" from any common repository URL format
		function extractOwnerRepo(raw: string): string | null {
			const cleaned = raw
				.replace(/^git\+/, "")
				.replace(/\.git$/, "")
				.replace(/^github:/, "");
			// git@github.com:owner/repo
			const ssh = cleaned.match(/github\.com[:/]([^/]+\/[^/]+)$/);
			if (ssh) return ssh[1].toLowerCase();
			// https://github.com/owner/repo(/...extra paths)
			const https = cleaned.match(/github\.com\/([^/]+\/[^/]+)/);
			if (https) return https[1].toLowerCase();
			// GitHub shorthand: "owner/repo"
			const shorthand = cleaned.match(/^([^/]+\/[^/]+)$/);
			if (shorthand) return shorthand[1].toLowerCase();
			return null;
		}

		for (const [pkgName, meta] of Object.entries(PACKAGES)) {
			const pkgJsonPath = resolve(
				__dirname,
				`../../../node_modules/${pkgName}/package.json`,
			);
			let depPkg: { repository?: { url?: string } | string };
			try {
				depPkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
			} catch {
				continue; // not installed locally — covered by the "installed" test
			}

			const repoField =
				typeof depPkg.repository === "string"
					? depPkg.repository
					: (depPkg.repository?.url ?? "");
			if (!repoField) continue; // some packages omit repository entirely

			const expected = extractOwnerRepo(repoField);
			const actual = extractOwnerRepo(meta.repoUrl);

			if (!expected) continue; // non-GitHub repo — skip

			expect(
				actual,
				`${pkgName} repoUrl "${meta.repoUrl}" does not match package.json repository "${repoField}" (expected owner/repo: ${expected})`,
			).toBe(expected);
		}
	});

	it("every PACKAGES entry has a valid SPDX license identifier", () => {
		const spdxPattern =
			/^(?:MIT|Apache-2\.0|BSD-[23]-Clause|ISC|MPL-2\.0|LGPL-[23]\.[01]|GPL-[23]\.0|AGPL-3\.0|Unlicense|0BSD|BlueOak-1\.0\.0)$/;
		for (const [pkgName, meta] of Object.entries(PACKAGES)) {
			expect(
				meta.license,
				`${pkgName} license "${meta.license}" is not a recognized SPDX identifier`,
			).toMatch(spdxPattern);
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
