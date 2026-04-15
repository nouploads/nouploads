import { describe, expect, it } from "vitest";
import {
	computeSqlStats,
	formatSql,
	MAX_SQL_SIZE,
	minifySql,
	SUPPORTED_DIALECTS,
	validateSql,
} from "~/features/developer-tools/processors/sql-formatter";

describe("formatSql", () => {
	it("should format a simple SELECT query with uppercased keywords", async () => {
		const input = "select id, name from users where id = 1";
		const result = await formatSql(input, { keywordCase: "upper" });
		expect(result).toContain("SELECT");
		expect(result).toContain("FROM");
		expect(result).toContain("WHERE");
		expect(result).toContain("\n");
	});

	it("should respect the lowercase keyword option", async () => {
		const input = "SELECT * FROM users";
		const result = await formatSql(input, { keywordCase: "lower" });
		expect(result).toContain("select");
		expect(result).toContain("from");
	});

	it("should respect the tabWidth option", async () => {
		const input = "SELECT id, name FROM users";
		const result = await formatSql(input, { tabWidth: 4 });
		const lines = result.split("\n");
		expect(lines[1]).toMatch(/^ {4}/);
	});

	it("should format PostgreSQL-specific syntax", async () => {
		const input = "SELECT id::text FROM users LIMIT 5";
		const result = await formatSql(input, { dialect: "postgresql" });
		expect(result).toContain("SELECT");
		expect(result).toContain("LIMIT");
	});

	it("should throw on malformed SQL", async () => {
		await expect(formatSql("SELECT ((( FROM")).rejects.toThrow();
	});

	it("should handle multi-statement queries", async () => {
		const input = "SELECT 1; SELECT 2;";
		const result = await formatSql(input);
		// Formatter may put literals on their own indented line — check
		// for the statement pieces rather than an exact substring.
		expect(result).toMatch(/SELECT[\s\S]*1/);
		expect(result).toMatch(/SELECT[\s\S]*2/);
	});
});

describe("minifySql", () => {
	it("should collapse whitespace runs to a single space", () => {
		expect(minifySql("SELECT   id\n  FROM    users")).toBe(
			"SELECT id FROM users",
		);
	});

	it("should strip line comments", () => {
		expect(minifySql("SELECT id -- comment\nFROM users")).toBe(
			"SELECT id FROM users",
		);
	});

	it("should strip block comments", () => {
		expect(minifySql("SELECT /* inline */ id FROM users")).toBe(
			"SELECT id FROM users",
		);
	});

	it("should strip multi-line block comments", () => {
		const input = "SELECT\n/*\n  multi\n  line\n*/\nid FROM users";
		expect(minifySql(input)).toBe("SELECT id FROM users");
	});

	it("should preserve whitespace inside single-quoted strings", () => {
		expect(minifySql("SELECT 'hello  world' FROM t")).toBe(
			"SELECT 'hello  world' FROM t",
		);
	});

	it("should preserve -- inside single-quoted strings (not a comment)", () => {
		expect(minifySql("SELECT 'a -- b' FROM t")).toBe("SELECT 'a -- b' FROM t");
	});

	it("should handle escaped single quotes", () => {
		expect(minifySql("SELECT 'it''s ok' FROM t")).toBe(
			"SELECT 'it''s ok' FROM t",
		);
	});

	it("should preserve whitespace inside double-quoted identifiers", () => {
		expect(minifySql('SELECT "col name" FROM t')).toBe(
			'SELECT "col name" FROM t',
		);
	});

	it("should return empty string for empty input", () => {
		expect(minifySql("")).toBe("");
	});

	it("should return empty string for whitespace-only input", () => {
		expect(minifySql("   \n\t  ")).toBe("");
	});

	it("should not insert leading whitespace", () => {
		expect(minifySql("  SELECT 1")).toBe("SELECT 1");
	});
});

describe("validateSql", () => {
	it("should return valid for a well-formed query", () => {
		const result = validateSql("SELECT * FROM users WHERE id = 1");
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("should return invalid for an empty string", () => {
		const result = validateSql("");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Empty input");
	});

	it("should return invalid for unbalanced opening paren", () => {
		const result = validateSql("SELECT (id, name FROM users");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("opening");
	});

	it("should return invalid for unbalanced closing paren", () => {
		const result = validateSql("SELECT id) FROM users");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("closing");
	});

	it("should return invalid for unterminated single-quoted string", () => {
		const result = validateSql("SELECT 'abc FROM users");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("single");
	});

	it("should ignore parentheses inside quoted strings", () => {
		const result = validateSql("SELECT '(hello) FROM users'");
		expect(result.valid).toBe(true);
	});

	it("should allow escaped single quotes inside strings", () => {
		const result = validateSql("SELECT 'it''s ok'");
		expect(result.valid).toBe(true);
	});
});

describe("computeSqlStats", () => {
	it("should count lines in multi-line output", () => {
		const stats = computeSqlStats("SELECT\n  id,\n  name\nFROM users");
		expect(stats.lines).toBe(4);
	});

	it("should return 0 lines for empty input", () => {
		const stats = computeSqlStats("");
		expect(stats.lines).toBe(0);
	});

	it("should report byte size", () => {
		const stats = computeSqlStats("SELECT 1");
		expect(stats.sizeBytes).toBe(8);
	});
});

describe("SUPPORTED_DIALECTS", () => {
	it("should include at least 10 dialects with value and label", () => {
		expect(SUPPORTED_DIALECTS.length).toBeGreaterThanOrEqual(10);
		for (const d of SUPPORTED_DIALECTS) {
			expect(d.value).toBeTruthy();
			expect(d.label).toBeTruthy();
		}
	});
});

describe("MAX_SQL_SIZE", () => {
	it("should be 10 MB", () => {
		expect(MAX_SQL_SIZE).toBe(10 * 1024 * 1024);
	});
});
