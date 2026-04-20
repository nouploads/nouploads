import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";
import { decodeJwt } from "../src/tools/jwt-decoder.js";

// Standard RFC 7519 example token. Header {alg:HS256, typ:JWT},
// payload {sub:"1234567890", name:"John Doe", iat:1516239022}.
const JWT_RFC7519 =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
	"eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ." +
	"SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("jwt-decoder tool", () => {
	it("is registered under developer category", () => {
		const tool = getTool("jwt-decoder");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
	});

	describe("decodeJwt", () => {
		it("decodes a valid JWT into header + payload", () => {
			const decoded = decodeJwt(JWT_RFC7519);
			expect(decoded.header).toEqual({ alg: "HS256", typ: "JWT" });
			expect(decoded.payload.sub).toBe("1234567890");
			expect(decoded.payload.name).toBe("John Doe");
		});

		it("surfaces the signature as hex and the raw base64url", () => {
			const decoded = decodeJwt(JWT_RFC7519);
			expect(decoded.signatureRaw).toMatch(/^[A-Za-z0-9_-]+$/);
			expect(decoded.signature).toMatch(/^[0-9a-f]+$/);
		});

		it("marks isExpired=false for a far-future exp", () => {
			const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
			const payload = btoa(JSON.stringify({ exp }))
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "");
			const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;
			expect(decodeJwt(token).isExpired).toBe(false);
		});

		it("throws on non-3-part input", () => {
			expect(() => decodeJwt("not.a")).toThrow(/3 parts/);
		});

		it("throws on empty input", () => {
			expect(() => decodeJwt("")).toThrow(/Empty/);
		});

		it("throws on non-JSON payload", () => {
			const badPayload = btoa("not-json")
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "");
			expect(() => decodeJwt(`eyJhbGciOiJIUzI1NiJ9.${badPayload}.sig`)).toThrow(
				/payload/,
			);
		});
	});

	describe("tool.execute()", () => {
		it("returns JSON containing header + payload", async () => {
			const tool = getTool("jwt-decoder");
			if (!tool) throw new Error("jwt-decoder not registered");
			const input = new TextEncoder().encode(JWT_RFC7519);
			const result = await tool.execute(input, {}, {});
			const body = JSON.parse(new TextDecoder().decode(result.output));
			expect(body.header.alg).toBe("HS256");
			expect(body.payload.sub).toBe("1234567890");
		});
	});
});
