import { describe, expect, it } from "vitest";
import {
	generateBulk,
	generateUuidV4,
	generateUuidV7,
	validateUuid,
} from "~/features/developer-tools/processors/uuid-generator";

const UUID_V4_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V7_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuidV4", () => {
	it("should return a valid v4 UUID", () => {
		const uuid = generateUuidV4();
		expect(uuid).toMatch(UUID_V4_REGEX);
	});

	it("should return unique values on each call", () => {
		const a = generateUuidV4();
		const b = generateUuidV4();
		expect(a).not.toBe(b);
	});
});

describe("generateUuidV7", () => {
	it("should return a valid v7 UUID", () => {
		const uuid = generateUuidV7();
		expect(uuid).toMatch(UUID_V7_REGEX);
	});

	it("should have the correct version nibble (7)", () => {
		const uuid = generateUuidV7();
		// Version nibble is at position 14 (0-indexed)
		expect(uuid[14]).toBe("7");
	});

	it("should have correct variant bits (10xx)", () => {
		const uuid = generateUuidV7();
		const variantChar = uuid[19];
		const nibble = Number.parseInt(variantChar, 16);
		// Top two bits should be 10 (values 8-b)
		expect(nibble & 0b1100).toBe(0b1000);
	});

	it("should sort lexicographically when generated in sequence", () => {
		// Generate two UUIDs with a small delay between them
		const first = generateUuidV7();
		// Busy-wait at least 1ms to ensure different timestamp
		const start = Date.now();
		while (Date.now() === start) {
			// spin
		}
		const second = generateUuidV7();
		expect(first < second).toBe(true);
	});
});

describe("generateBulk", () => {
	it("should generate the requested number of v4 UUIDs", () => {
		const uuids = generateBulk("v4", 100);
		expect(uuids).toHaveLength(100);
		for (const uuid of uuids) {
			expect(uuid).toMatch(UUID_V4_REGEX);
		}
	});

	it("should generate the requested number of v7 UUIDs", () => {
		const uuids = generateBulk("v7", 50);
		expect(uuids).toHaveLength(50);
		for (const uuid of uuids) {
			expect(uuid).toMatch(UUID_V7_REGEX);
		}
	});

	it("should produce all unique UUIDs", () => {
		const uuids = generateBulk("v4", 100);
		const unique = new Set(uuids);
		expect(unique.size).toBe(100);
	});

	it("should clamp count to 1000", () => {
		const uuids = generateBulk("v4", 2000);
		expect(uuids).toHaveLength(1000);
	});

	it("should clamp count to minimum of 1", () => {
		const uuids = generateBulk("v4", -5);
		expect(uuids).toHaveLength(1);
	});
});

describe("validateUuid", () => {
	it("should validate a v4 UUID", () => {
		const uuid = generateUuidV4();
		const result = validateUuid(uuid);
		expect(result.valid).toBe(true);
		expect(result.version).toBe(4);
		expect(result.variant).toBe("RFC 4122");
	});

	it("should validate a v7 UUID and extract timestamp", () => {
		const before = Date.now();
		const uuid = generateUuidV7();
		const after = Date.now();
		const result = validateUuid(uuid);

		expect(result.valid).toBe(true);
		expect(result.version).toBe(7);
		expect(result.variant).toBe("RFC 4122");
		expect(result.timestamp).toBeInstanceOf(Date);

		const ts = result.timestamp?.getTime() ?? 0;
		expect(ts).toBeGreaterThanOrEqual(before);
		expect(ts).toBeLessThanOrEqual(after);
	});

	it("should reject an empty string", () => {
		const result = validateUuid("");
		expect(result.valid).toBe(false);
		expect(result.version).toBeNull();
		expect(result.variant).toBeNull();
	});

	it("should reject 'not-a-uuid'", () => {
		const result = validateUuid("not-a-uuid");
		expect(result.valid).toBe(false);
		expect(result.version).toBeNull();
		expect(result.variant).toBeNull();
	});

	it("should handle uppercase input", () => {
		const uuid = generateUuidV4().toUpperCase();
		const result = validateUuid(uuid);
		expect(result.valid).toBe(true);
		expect(result.version).toBe(4);
	});

	it("should handle input with whitespace", () => {
		const uuid = `  ${generateUuidV4()}  `;
		const result = validateUuid(uuid);
		expect(result.valid).toBe(true);
	});

	it("should validate a known v1 UUID", () => {
		// A well-known v1 UUID
		const result = validateUuid("550e8400-e29b-11d4-a716-446655440000");
		expect(result.valid).toBe(true);
		expect(result.version).toBe(1);
		expect(result.variant).toBe("RFC 4122");
	});

	it("should not have timestamp for non-v7 UUIDs", () => {
		const uuid = generateUuidV4();
		const result = validateUuid(uuid);
		expect(result.timestamp).toBeUndefined();
	});
});
