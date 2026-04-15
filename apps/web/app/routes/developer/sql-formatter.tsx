import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/sql-formatter";

const SqlFormatterTool = lazy(
	() => import("~/features/developer-tools/components/sql-formatter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "SQL Formatter Online — Free, Instant | NoUploads",
		description:
			"Beautify and minify SQL queries in your browser — supports MySQL, PostgreSQL, SQLite, BigQuery and more. No data leaves your device. Handles queries up to 10 MB.",
		path: "/developer/sql-formatter",
		keywords:
			"sql formatter, sql beautifier, format sql online, prettify sql, sql minifier, mysql formatter, postgresql formatter, query formatter, sql pretty print",
		jsonLdName: "SQL Formatter",
		faq: [
			{
				question: "Who standardized SQL?",
				answer:
					"SQL was invented at IBM in the early 1970s by Donald Chamberlin and Raymond Boyce as part of the System R research project. It was later standardized by ANSI in 1986 and by ISO in 1987. The current revision is ISO/IEC 9075:2023, and every major relational database — PostgreSQL, MySQL, SQLite, Oracle, SQL Server — implements a dialect of it.",
			},
			{
				question: "Which SQL dialects are supported?",
				answer:
					"The formatter supports Standard SQL, MySQL, PostgreSQL, SQLite, MariaDB, SQL Server (T-SQL), Oracle (PL/SQL), BigQuery, Snowflake, and Redshift. Pick the dialect that matches your database so vendor-specific syntax like PostgreSQL ::text casts, T-SQL bracketed identifiers, or BigQuery STRUCT literals are preserved.",
			},
			{
				question: "What's the difference between formatting and minifying SQL?",
				answer:
					"Formatting reflows a query with newlines and indentation so keywords, clauses, and joins line up. Minifying strips comments and collapses runs of whitespace into single spaces, producing a single-line query that is smaller to transmit but harder to read. Both preserve exact query semantics — only whitespace and comments change.",
			},
			{
				question: "Can it detect SQL syntax errors?",
				answer:
					"The tool performs lightweight checks for unbalanced parentheses and unterminated strings, and the underlying formatter will reject queries it cannot parse. It is not a full SQL linter or a replacement for running the query against your database — semantic errors (bad column names, missing tables) still need the real database to catch.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Who standardized SQL?",
		answer: (
			<>
				SQL was invented at IBM in the early 1970s by Donald Chamberlin and
				Raymond Boyce as part of the System R research project. It was later
				standardized by ANSI in 1986 and by ISO in 1987. The current revision is
				ISO/IEC 9075:2023, and every major relational database — PostgreSQL,
				MySQL, SQLite, Oracle, SQL Server — implements a dialect of it. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/SQL"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Wikipedia
				</a>
			</>
		),
	},
	{
		question: "Which SQL dialects are supported?",
		answer:
			"The formatter supports Standard SQL, MySQL, PostgreSQL, SQLite, MariaDB, SQL Server (T-SQL), Oracle (PL/SQL), BigQuery, Snowflake, and Redshift. Pick the dialect that matches your database so vendor-specific syntax like PostgreSQL ::text casts, T-SQL bracketed identifiers, or BigQuery STRUCT literals are preserved.",
	},
	{
		question: "What's the difference between formatting and minifying SQL?",
		answer:
			"Formatting reflows a query with newlines and indentation so keywords, clauses, and joins line up. Minifying strips comments and collapses runs of whitespace into single spaces, producing a single-line query that is smaller to transmit but harder to read. Both preserve exact query semantics — only whitespace and comments change.",
	},
	{
		question: "Can it detect SQL syntax errors?",
		answer:
			"The tool performs lightweight checks for unbalanced parentheses and unterminated strings, and the underlying formatter will reject queries it cannot parse. It is not a full SQL linter or a replacement for running the query against your database — semantic errors (bad column names, missing tables) still need the real database to catch.",
	},
];

export default function SqlFormatterPage() {
	return (
		<ToolPageLayout
			title="SQL Formatter"
			description="Beautify and minify SQL queries across 10 dialects — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<SqlFormatterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The SQL Formatter beautifies and minifies SQL queries directly in your
					browser. Paste a query or upload a .sql file to reflow it with
					consistent indentation, keyword casing, and line breaks — or strip
					comments and collapse whitespace for a single-line minified form.
					Dialect-aware across MySQL, PostgreSQL, SQLite, SQL Server, Oracle,
					BigQuery, Snowflake, and Redshift so vendor-specific syntax stays
					intact. The sql-formatter library is lazy-loaded on first format so
					the page itself opens instantly, and nothing is ever uploaded.
				</p>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-4">
					Frequently Asked Questions
				</h2>
				<Accordion type="multiple">
					{faqItems.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list never changes
						<AccordionItem key={i} value={`faq-${i}`}>
							<AccordionTrigger>{item.question}</AccordionTrigger>
							<AccordionContent>
								<p className="text-muted-foreground">{item.answer}</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<p className="text-xs text-muted-foreground mt-8">
				Powered by{" "}
				<a
					href="https://github.com/sql-formatter-org/sql-formatter"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					sql-formatter
				</a>{" "}
				· MIT
			</p>
		</ToolPageLayout>
	);
}
