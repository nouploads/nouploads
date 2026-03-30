import { describe, expect, it } from "vitest";
import { decodeJwt } from "~/features/developer-tools/processors/jwt-decoder";

// jwt.io example token
const JWT_IO_TOKEN =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/**
 * Helper to create a JWT with a given payload.
 * Uses HS256 header and a dummy signature.
 */
function makeJwt(payload: Record<string, unknown>): string {
	const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
	const payloadB64 = btoa(JSON.stringify(payload))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
	const sig = btoa("fakesignature")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
	return `${header}.${payloadB64}.${sig}`;
}

describe("decodeJwt", () => {
	it("should decode the jwt.io example token", () => {
		const result = decodeJwt(JWT_IO_TOKEN);

		expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
		expect(result.payload).toEqual({
			sub: "1234567890",
			name: "John Doe",
			iat: 1516239022,
		});
		expect(result.headerRaw).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
		expect(result.payloadRaw).toBe(
			"eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
		);
		expect(result.signatureRaw).toBe(
			"SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
		);
		expect(result.signature).toMatch(/^[0-9a-f]+$/);
		expect(result.signature.length).toBeGreaterThan(0);
	});

	it("should detect expired token (exp in the past)", () => {
		// exp = 1000000000 → Sep 8 2001, well in the past
		const token = makeJwt({ sub: "user1", exp: 1000000000 });
		const result = decodeJwt(token);

		expect(result.isExpired).toBe(true);
		expect(result.expiresAt).toBeInstanceOf(Date);
		expect(result.expiresAt?.getTime()).toBe(1000000000 * 1000);
	});

	it("should detect valid token (exp in the future)", () => {
		// exp = year 2100
		const futureExp = Math.floor(new Date("2100-01-01").getTime() / 1000);
		const token = makeJwt({ sub: "user2", exp: futureExp });
		const result = decodeJwt(token);

		expect(result.isExpired).toBe(false);
		expect(result.expiresAt).toBeInstanceOf(Date);
	});

	it("should return null expiration when no exp claim", () => {
		const token = makeJwt({ sub: "user3", name: "No Expiry" });
		const result = decodeJwt(token);

		expect(result.isExpired).toBeNull();
		expect(result.expiresAt).toBeNull();
	});

	it("should throw on invalid base64 payload (not.a.jwt)", () => {
		expect(() => decodeJwt("not.a.jwt")).toThrow();
	});

	it("should throw on wrong number of parts (too few)", () => {
		expect(() => decodeJwt("only.two")).toThrow(
			"Invalid JWT: expected 3 parts separated by dots",
		);
	});

	it("should throw on wrong number of parts (too many)", () => {
		expect(() => decodeJwt("one.two.three.four")).toThrow(
			"Invalid JWT: expected 3 parts separated by dots",
		);
	});

	it("should throw on empty string", () => {
		expect(() => decodeJwt("")).toThrow("Empty input");
	});

	it("should throw on whitespace-only string", () => {
		expect(() => decodeJwt("   ")).toThrow("Empty input");
	});

	it("should handle tokens with padding-required base64url", () => {
		// The jwt.io token has base64url segments that need padding — already tested above
		// This additionally tests that we handle various base64url chars
		const result = decodeJwt(JWT_IO_TOKEN);
		expect(result.header.alg).toBe("HS256");
	});

	it("should trim whitespace around the token", () => {
		const result = decodeJwt(`  ${JWT_IO_TOKEN}  `);
		expect(result.header.alg).toBe("HS256");
		expect(result.payload.name).toBe("John Doe");
	});

	it("should preserve all payload claims", () => {
		const claims = {
			sub: "abc123",
			iss: "https://example.com",
			aud: "my-app",
			exp: 9999999999,
			iat: 1700000000,
			custom: { nested: true, count: 42 },
		};
		const token = makeJwt(claims);
		const result = decodeJwt(token);

		expect(result.payload.sub).toBe("abc123");
		expect(result.payload.iss).toBe("https://example.com");
		expect(result.payload.aud).toBe("my-app");
		expect(result.payload.custom).toEqual({ nested: true, count: 42 });
	});
});
