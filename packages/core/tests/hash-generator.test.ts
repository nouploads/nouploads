import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import { generateHashes } from "../src/tools/hash-generator.js";

describe("hash-generator tool", () => {
	it("is registered under developer category", () => {
		const tool = getTool("hash-generator");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	it("returns MD5/SHA-1/256/384/512 for a known string", async () => {
		// Known reference values for the empty string (RFC 1321, FIPS 180-4).
		const hashes = await generateHashes(new Uint8Array());
		expect(hashes.md5).toBe("d41d8cd98f00b204e9800998ecf8427e");
		expect(hashes.sha1).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
		expect(hashes.sha256).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		expect(hashes.sha384.length).toBe(96);
		expect(hashes.sha512.length).toBe(128);
	});

	it("matches known MD5 for 'abc'", async () => {
		const hashes = await generateHashes(new TextEncoder().encode("abc"));
		expect(hashes.md5).toBe("900150983cd24fb0d6963f7d28e17f72");
		expect(hashes.sha256).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});

	it("execute() returns JSON containing the five hash fields", async () => {
		const tool = getTool("hash-generator");
		if (!tool) throw new Error("hash-generator not registered");
		const result = await tool.execute(
			new TextEncoder().encode("hello"),
			{},
			{},
		);
		expect(result.extension).toBe(".json");
		const body = JSON.parse(new TextDecoder().decode(result.output));
		expect(Object.keys(body).sort()).toEqual([
			"md5",
			"sha1",
			"sha256",
			"sha384",
			"sha512",
		]);
		expect(body.md5).toMatch(/^[0-9a-f]{32}$/);
		expect(body.sha256).toMatch(/^[0-9a-f]{64}$/);
	});
});
