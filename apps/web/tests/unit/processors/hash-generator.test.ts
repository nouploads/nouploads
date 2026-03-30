import { describe, expect, it } from "vitest";
import { generateHashes } from "~/features/developer-tools/processors/hash-generator";

describe("generateHashes", () => {
	it("should produce correct hashes for empty input", async () => {
		const data = new Uint8Array(0);
		const result = await generateHashes(data);

		expect(result.md5).toBe("d41d8cd98f00b204e9800998ecf8427e");
		expect(result.sha1).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
		expect(result.sha256).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
		expect(result.sha384).toBe(
			"38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
		);
		expect(result.sha512).toBe(
			"cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
		);
	});

	it('should produce correct hashes for "hello"', async () => {
		const data = new TextEncoder().encode("hello");
		const result = await generateHashes(data);

		expect(result.md5).toBe("5d41402abc4b2a76b9719d911017c592");
		expect(result.sha256).toBe(
			"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
		);
	});

	it('should produce correct SHA-256 for "Hello World"', async () => {
		const data = new TextEncoder().encode("Hello World");
		const result = await generateHashes(data);

		expect(result.sha256).toBe(
			"a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
		);
	});

	it("should produce correct hashes for binary data", async () => {
		const data = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff]);
		const result = await generateHashes(data);

		// All hashes should be non-empty hex strings
		expect(result.md5).toMatch(/^[0-9a-f]{32}$/);
		expect(result.sha1).toMatch(/^[0-9a-f]{40}$/);
		expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
		expect(result.sha384).toMatch(/^[0-9a-f]{96}$/);
		expect(result.sha512).toMatch(/^[0-9a-f]{128}$/);
	});

	it("should produce different hashes for different inputs", async () => {
		const a = await generateHashes(new TextEncoder().encode("abc"));
		const b = await generateHashes(new TextEncoder().encode("abd"));

		expect(a.md5).not.toBe(b.md5);
		expect(a.sha256).not.toBe(b.sha256);
		expect(a.sha512).not.toBe(b.sha512);
	});

	it("should produce correct MD5 for a longer string", async () => {
		// "The quick brown fox jumps over the lazy dog"
		const data = new TextEncoder().encode(
			"The quick brown fox jumps over the lazy dog",
		);
		const result = await generateHashes(data);

		expect(result.md5).toBe("9e107d9d372bb6826bd81d3542a419d6");
	});

	it("should produce correct SHA-1 for known test vector", async () => {
		const data = new TextEncoder().encode("abc");
		const result = await generateHashes(data);

		expect(result.sha1).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
	});

	it("should handle input that spans multiple MD5 blocks (>64 bytes)", async () => {
		// 100 bytes of data
		const data = new Uint8Array(100);
		for (let i = 0; i < 100; i++) {
			data[i] = i % 256;
		}
		const result = await generateHashes(data);

		// Should still produce valid hex strings
		expect(result.md5).toMatch(/^[0-9a-f]{32}$/);
		expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
	});
});
