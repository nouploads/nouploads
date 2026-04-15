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
import type { Route } from "./+types/html-formatter";

const HtmlFormatterTool = lazy(
	() => import("~/features/developer-tools/components/html-formatter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "HTML Formatter Online — Free, Instant | NoUploads",
		description:
			"Beautify messy HTML markup in your browser with configurable indent and line wrap. No data leaves your device. Handles documents up to 10 MB.",
		path: "/developer/html-formatter",
		keywords:
			"html formatter, html beautifier, format html online, prettify html, html indent, pretty print html, clean html, html pretty print",
		jsonLdName: "HTML Formatter",
		faq: [
			{
				question: "Who invented HTML?",
				answer:
					"HTML was created by Tim Berners-Lee in 1991 at CERN as the markup language for the World Wide Web. The first public specification, HTML Tags, described 18 elements — 11 of which still exist in HTML5. HTML is now maintained as a living standard by the WHATWG and published in parallel by the W3C.",
			},
			{
				question: "Which elements is the formatter configured not to reflow?",
				answer:
					"js-beautify treats <pre>, <textarea>, <code>, <script>, and <style> as content-sensitive by default — their inner whitespace is preserved so formatting does not corrupt code samples or CSS rules. Inline tags like <span>, <a>, <b>, and <i> stay on the same line as their surrounding text unless a line-wrap kicks in.",
			},
			{
				question: "Will the formatter change my markup's meaning?",
				answer:
					"No. js-beautify only rewrites whitespace — it never adds, removes, or reorders elements or attributes. Running it on a valid document produces an equivalent document that parses to the same DOM tree. For content-sensitive elements like <pre>, inner whitespace is preserved exactly as written.",
			},
			{
				question: "What does the line wrap setting do?",
				answer:
					"When a line grows past the chosen length (80, 120, or 160 characters), the formatter breaks before the next attribute or child so each fragment fits. Set it to No wrap to disable — useful for preserving long attribute strings or single-line inline SVG. Line wrap never breaks inside a string literal.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Who invented HTML?",
		answer: (
			<>
				HTML was created by Tim Berners-Lee in 1991 at CERN as the markup
				language for the World Wide Web. The first public specification, HTML
				Tags, described 18 elements — 11 of which still exist in HTML5. HTML is
				now maintained as a living standard by the WHATWG and published in
				parallel by the W3C. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/HTML"
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
		question: "Which elements is the formatter configured not to reflow?",
		answer:
			"js-beautify treats <pre>, <textarea>, <code>, <script>, and <style> as content-sensitive by default — their inner whitespace is preserved so formatting does not corrupt code samples or CSS rules. Inline tags like <span>, <a>, <b>, and <i> stay on the same line as their surrounding text unless a line-wrap kicks in.",
	},
	{
		question: "Will the formatter change my markup's meaning?",
		answer:
			"No. js-beautify only rewrites whitespace — it never adds, removes, or reorders elements or attributes. Running it on a valid document produces an equivalent document that parses to the same DOM tree. For content-sensitive elements like <pre>, inner whitespace is preserved exactly as written.",
	},
	{
		question: "What does the line wrap setting do?",
		answer:
			"When a line grows past the chosen length (80, 120, or 160 characters), the formatter breaks before the next attribute or child so each fragment fits. Set it to No wrap to disable — useful for preserving long attribute strings or single-line inline SVG. Line wrap never breaks inside a string literal.",
	},
];

export default function HtmlFormatterPage() {
	return (
		<ToolPageLayout
			title="HTML Formatter"
			description="Beautify HTML markup with configurable indent and line wrap — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<HtmlFormatterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The HTML Formatter beautifies messy HTML markup directly in your
					browser. Paste a snippet or upload a .html file to reflow it with
					consistent indentation, proper nesting, and configurable line
					wrapping. Content-sensitive elements like{" "}
					<code className="font-mono text-xs">&lt;pre&gt;</code>,{" "}
					<code className="font-mono text-xs">&lt;textarea&gt;</code>,{" "}
					<code className="font-mono text-xs">&lt;script&gt;</code>, and{" "}
					<code className="font-mono text-xs">&lt;style&gt;</code> keep their
					inner whitespace exactly as written, so code samples and CSS rules are
					never corrupted. The js-beautify library is lazy-loaded on first
					format so the page itself opens instantly, and nothing is ever
					uploaded.
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
