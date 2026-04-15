import { describe, expect, it } from "vitest";
import { getTool } from "../src/registry.js";

// Import to trigger registration
import "../src/tools/sql-formatter.js";
import { minifySqlText } from "../src/tools/sql-formatter.js";

describe("sql-formatter tool", () => {
	it("should be registered", () => {
		const tool = getTool("sql-formatter");
		expect(tool).toBeDefined();
		expect(tool?.category).toBe("developer");
		expect(tool?.id).toBe("sql-formatter");
	});

	it("should format a simple SELECT query", async () => {
		const tool = getTool("sql-formatter");
		if (!tool) throw new Error("sql-formatter not registered");

		const input = "select id, name from users where status = 1";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ mode: "format", dialect: "sql", keywordCase: "upper" },
			{},
		);

		expect(result.extension).toBe(".sql");
		expect(result.mimeType).toBe("application/sql");

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("SELECT");
		expect(output).toContain("FROM");
		expect(output).toContain("WHERE");
		expect(output).toContain("\n");
	});

	it("should preserve lowercase keywords when keywordCase is lower", async () => {
		const tool = getTool("sql-formatter");
		if (!tool) throw new Error("sql-formatter not registered");

		const input = "SELECT * FROM users";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ mode: "format", dialect: "sql", keywordCase: "lower" },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		expect(output).toContain("select");
		expect(output).toContain("from");
	});

	it("should respect tabWidth option", async () => {
		const tool = getTool("sql-formatter");
		if (!tool) throw new Error("sql-formatter not registered");

		const input = "SELECT id, name FROM users";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(
			encoded,
			{ mode: "format", dialect: "sql", tabWidth: 4 },
			{},
		);

		const output = new TextDecoder().decode(result.output);
		// Second line should start with 4 spaces (the indent before id)
		const lines = output.split("\n");
		expect(lines[1]).toMatch(/^ {4}/);
	});

	it("should minify a formatted query", async () => {
		const tool = getTool("sql-formatter");
		if (!tool) throw new Error("sql-formatter not registered");

		const input = "SELECT\n  id,\n  name\nFROM users\nWHERE id = 1";
		const encoded = new TextEncoder().encode(input);
		const result = await tool.execute(encoded, { mode: "minify" }, {});

		const output = new TextDecoder().decode(result.output);
		expect(output).not.toContain("\n");
		expect(output).toContain("SELECT");
		expect(output).toContain("FROM users");
	});

	it("should throw on malformed SQL in format mode", async () => {
		const tool = getTool("sql-formatter");
		if (!tool) throw new Error("sql-formatter not registered");

		// A truly malformed query sql-formatter will reject
		const input = "SELECT ((( FROM";
		const encoded = new TextEncoder().encode(input);
		await expect(
			tool.execute(encoded, { mode: "format", dialect: "sql" }, {}),
		).rejects.toThrow();
	});
});

describe("minifySqlText", () => {
	it("should collapse whitespace", () => {
		expect(minifySqlText("SELECT   id\n  FROM    users")).toBe(
			"SELECT id FROM users",
		);
	});

	it("should strip line comments", () => {
		expect(minifySqlText("SELECT id -- comment\nFROM users")).toBe(
			"SELECT id FROM users",
		);
	});

	it("should strip block comments", () => {
		expect(minifySqlText("SELECT /* inline */ id FROM users")).toBe(
			"SELECT id FROM users",
		);
	});

	it("should preserve whitespace inside single-quoted strings", () => {
		expect(minifySqlText("SELECT   'hello  world'   FROM t")).toBe(
			"SELECT 'hello  world' FROM t",
		);
	});

	it("should handle escaped single quotes in strings", () => {
		expect(minifySqlText("SELECT  'it''s  ok'  FROM t")).toBe(
			"SELECT 'it''s  ok' FROM t",
		);
	});

	it("should preserve whitespace inside double-quoted identifiers", () => {
		expect(minifySqlText('SELECT  "col name"  FROM t')).toBe(
			'SELECT "col name" FROM t',
		);
	});

	it("should handle empty input", () => {
		expect(minifySqlText("")).toBe("");
	});

	it("should handle input that is only whitespace", () => {
		expect(minifySqlText("   \n\t  ")).toBe("");
	});
});
