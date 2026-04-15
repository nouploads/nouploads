/**
 * SQL formatting and minification.
 * The sql-formatter library (~85 KB) is dynamically imported so it only
 * ships when the user actually formats a query.
 */

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
 * Format SQL using sql-formatter (lazy-loaded on first call).
 */
export async function formatSql(
	input: string,
	options: FormatSqlOptions = {},
): Promise<string> {
	const { dialect = "sql", keywordCase = "upper", tabWidth = 2 } = options;
	const { format } = await import("sql-formatter");
	return format(input, {
		language: dialect,
		keywordCase,
		tabWidth,
	});
}

/**
 * Minify SQL by collapsing whitespace and stripping comments.
 * Pure JS — does not require the sql-formatter library.
 * Preserves content inside single-quoted strings and double-quoted identifiers.
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
