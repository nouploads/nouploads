import { getTool, isToolResultMulti } from "@nouploads/core";

export type SqlDialect =
	| "sql"
	| "mysql"
	| "postgresql"
	| "sqlite"
	| "bigquery"
	| "snowflake"
	| "mariadb"
	| "transactsql"
	| "plsql"
	| "redshift";

export type KeywordCase = "upper" | "lower" | "preserve";

export const SUPPORTED_DIALECTS: { value: SqlDialect; label: string }[] = [
	{ value: "sql", label: "Standard SQL" },
	{ value: "mysql", label: "MySQL" },
	{ value: "postgresql", label: "PostgreSQL" },
	{ value: "sqlite", label: "SQLite" },
	{ value: "mariadb", label: "MariaDB" },
	{ value: "transactsql", label: "SQL Server" },
	{ value: "plsql", label: "Oracle" },
	{ value: "bigquery", label: "BigQuery" },
	{ value: "snowflake", label: "Snowflake" },
	{ value: "redshift", label: "Redshift" },
];

export interface FormatSqlOptions {
	dialect?: SqlDialect;
	keywordCase?: KeywordCase;
	tabWidth?: number;
}

export interface SqlStats {
	/** Total lines of output */
	lines: number;
	/** Byte size of the output */
	sizeBytes: number;
}

/** Max input size: 10 MB of raw SQL text */
export const MAX_SQL_SIZE = 10 * 1024 * 1024;

/**
 * Format SQL via @nouploads/core's sql-formatter tool (uses the
 * sql-formatter library under the hood).
 */
export async function formatSql(
	input: string,
	options: FormatSqlOptions = {},
): Promise<string> {
	const tool = getTool("sql-formatter");
	if (!tool) throw new Error("sql-formatter tool not found in core registry");

	const result = await tool.execute(
		new TextEncoder().encode(input),
		{
			mode: "format",
			dialect: options.dialect ?? "sql",
			keywordCase: options.keywordCase ?? "upper",
			tabWidth: options.tabWidth ?? 2,
		},
		{},
	);

	if (isToolResultMulti(result)) {
		throw new Error("sql-formatter unexpectedly returned multiple outputs");
	}

	return new TextDecoder().decode(result.output);
}

/**
 * Minify SQL by collapsing whitespace and stripping comments. Pure JS —
 * does not require the sql-formatter library. Preserves content inside
 * single-quoted strings and double-quoted identifiers.
 *
 * Kept local because the web component calls it synchronously for instant
 * UI updates while the user toggles between Format and Minify.
 */
export function minifySql(input: string): string {
	let out = "";
	let i = 0;
	const n = input.length;
	let pendingSpace = false;

	while (i < n) {
		const ch = input[i];
		const next = input[i + 1];

		// Line comment
		if (ch === "-" && next === "-") {
			while (i < n && input[i] !== "\n") i++;
			pendingSpace = true;
			continue;
		}
		// Block comment
		if (ch === "/" && next === "*") {
			i += 2;
			while (i < n && !(input[i] === "*" && input[i + 1] === "/")) i++;
			i += 2;
			pendingSpace = true;
			continue;
		}
		// Single-quoted string literal
		if (ch === "'") {
			if (pendingSpace && out.length > 0) out += " ";
			pendingSpace = false;
			out += ch;
			i++;
			while (i < n) {
				if (input[i] === "'" && input[i + 1] === "'") {
					out += "''";
					i += 2;
					continue;
				}
				out += input[i];
				if (input[i] === "'") {
					i++;
					break;
				}
				i++;
			}
			continue;
		}
		// Double-quoted identifier
		if (ch === '"') {
			if (pendingSpace && out.length > 0) out += " ";
			pendingSpace = false;
			out += ch;
			i++;
			while (i < n) {
				out += input[i];
				if (input[i] === '"') {
					i++;
					break;
				}
				i++;
			}
			continue;
		}
		// Whitespace run
		if (/\s/.test(ch)) {
			pendingSpace = true;
			while (i < n && /\s/.test(input[i])) i++;
			continue;
		}
		if (pendingSpace && out.length > 0) out += " ";
		pendingSpace = false;
		out += ch;
		i++;
	}

	return out;
}

/**
 * Validate that input looks like SQL — basic check for unbalanced parens
 * or quotes. Real parse errors surface from formatSql itself.
 */
export function validateSql(input: string): {
	valid: boolean;
	error?: string;
} {
	if (!input.trim()) {
		return { valid: false, error: "Empty input" };
	}

	let parenDepth = 0;
	let inSingle = false;
	let inDouble = false;
	for (let i = 0; i < input.length; i++) {
		const ch = input[i];
		if (!inSingle && !inDouble) {
			if (ch === "(") parenDepth++;
			else if (ch === ")") parenDepth--;
			else if (ch === "'") inSingle = true;
			else if (ch === '"') inDouble = true;
			if (parenDepth < 0) {
				return { valid: false, error: "Unbalanced closing parenthesis" };
			}
		} else if (inSingle) {
			if (ch === "'" && input[i + 1] === "'") {
				i++;
			} else if (ch === "'") {
				inSingle = false;
			}
		} else if (inDouble && ch === '"') {
			inDouble = false;
		}
	}

	if (parenDepth > 0) {
		return { valid: false, error: "Unbalanced opening parenthesis" };
	}
	if (inSingle) {
		return { valid: false, error: "Unterminated single-quoted string" };
	}
	if (inDouble) {
		return { valid: false, error: "Unterminated double-quoted identifier" };
	}
	return { valid: true };
}

export function computeSqlStats(text: string): SqlStats {
	return {
		lines: text ? text.split("\n").length : 0,
		sizeBytes: new TextEncoder().encode(text).byteLength,
	};
}
