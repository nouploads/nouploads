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
import type { Route } from "./+types/js-formatter";

const JsFormatterTool = lazy(
	() => import("~/features/developer-tools/components/js-formatter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JavaScript Formatter Online — Free, Instant | NoUploads",
		description:
			"Beautify minified or compressed JavaScript in your browser with configurable indent and brace style. No data leaves your device. Handles files up to 10 MB.",
		path: "/developer/js-formatter",
		keywords:
			"javascript formatter, js beautifier, format js online, prettify javascript, js pretty print, unminify js, unminify javascript, code formatter",
		jsonLdName: "JavaScript Formatter",
		faq: [
			{
				question: "How long did it take to design JavaScript?",
				answer:
					"Brendan Eich wrote the first JavaScript prototype in 10 days in May 1995 while at Netscape, originally under the name Mocha, then LiveScript, before settling on JavaScript. It was standardized as ECMA-262 (commonly called ECMAScript) in 1997, and the language has evolved through annual spec revisions since ES2015.",
			},
			{
				question: "Can this tool unminify bundled JavaScript?",
				answer:
					"Yes — paste any minified bundle and the formatter will restore newlines, indentation, and spacing so the code is readable. It cannot recover original variable names or source-level comments (those are lost during minification), but structure, scope, and control flow come back. For full source reconstruction you need a source map, not just beautification.",
			},
			{
				question: "Does the formatter understand TypeScript or JSX?",
				answer:
					"js-beautify is a JavaScript beautifier, so TypeScript type annotations and JSX markup are handled as best-effort. Most code reformats correctly, but uncommon generic-type syntax, decorators, or complex JSX expressions may produce surprising output. For heavy TypeScript or JSX work, Prettier is a better fit.",
			},
			{
				question: "What does the brace style setting change?",
				answer:
					"Same line (collapse) puts the opening brace at the end of the declaration, like `function f() {`. New line (expand) puts it on its own line, like `function f()\\n{`. End expand is a hybrid that places the closing brace alone but keeps the opening inline. All three are valid JavaScript — pick whichever matches your team's style guide.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How long did it take to design JavaScript?",
		answer: (
			<>
				Brendan Eich wrote the first JavaScript prototype in 10 days in May 1995
				while at Netscape, originally under the name Mocha, then LiveScript,
				before settling on JavaScript. It was standardized as ECMA-262 (commonly
				called ECMAScript) in 1997, and the language has evolved through annual
				spec revisions since ES2015. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/JavaScript"
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
		question: "Can this tool unminify bundled JavaScript?",
		answer:
			"Yes — paste any minified bundle and the formatter will restore newlines, indentation, and spacing so the code is readable. It cannot recover original variable names or source-level comments (those are lost during minification), but structure, scope, and control flow come back. For full source reconstruction you need a source map, not just beautification.",
	},
	{
		question: "Does the formatter understand TypeScript or JSX?",
		answer:
			"js-beautify is a JavaScript beautifier, so TypeScript type annotations and JSX markup are handled as best-effort. Most code reformats correctly, but uncommon generic-type syntax, decorators, or complex JSX expressions may produce surprising output. For heavy TypeScript or JSX work, Prettier is a better fit.",
	},
	{
		question: "What does the brace style setting change?",
		answer:
			"Same line (collapse) puts the opening brace at the end of the declaration, like function f() {. New line (expand) puts it on its own line. End expand is a hybrid that places the closing brace alone but keeps the opening inline. All three are valid JavaScript — pick whichever matches your team's style guide.",
	},
];

export default function JsFormatterPage() {
	return (
		<ToolPageLayout
			title="JavaScript Formatter"
			description="Beautify minified or compressed JavaScript with configurable indent and brace style — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<JsFormatterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The JavaScript Formatter unminifies and beautifies JS source directly
					in your browser. Paste a minified bundle or a single-line snippet and
					reflow it with consistent indentation, proper spacing around
					operators, and a configurable brace placement style. Works on plain
					JavaScript, most ECMAScript features (async/await, classes,
					destructuring, template literals, optional chaining), and basic
					TypeScript or JSX as best-effort. The js-beautify library is
					lazy-loaded on first format so the page opens instantly, and nothing
					is ever uploaded.
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
					href="https://github.com/beautifier/js-beautify"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					js-beautify
				</a>{" "}
				· MIT
			</p>
		</ToolPageLayout>
	);
}
