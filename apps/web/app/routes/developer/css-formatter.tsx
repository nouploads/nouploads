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
import type { Route } from "./+types/css-formatter";

const CssFormatterTool = lazy(
	() => import("~/features/developer-tools/components/css-formatter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "CSS Formatter Online — Free, Instant | NoUploads",
		description:
			"Minify or beautify CSS in your browser — free, strips comments and collapses whitespace or adds clean indentation. No data sent to any server. No dependencies.",
		path: "/developer/css-formatter",
		keywords:
			"css minifier, css beautifier, css formatter, minify css online, prettify css, format css, compress css, css optimizer",
		jsonLdName: "CSS Formatter",
		faq: [
			{
				question: "What is the origin of Cascading Style Sheets?",
				answer:
					"CSS was first proposed by Hakon Wium Lie on October 10, 1994, while working at CERN alongside Tim Berners-Lee. The first official specification, CSS Level 1, was published as a W3C Recommendation in December 1996. Lie's proposal won out over several competing stylesheet languages because it allowed styles to cascade — letting author and user preferences blend rather than one overriding the other entirely.",
			},
			{
				question:
					"What are the limitations of regex-based CSS minification compared to a full parser?",
				answer:
					"Regex-based minification handles the most impactful optimizations — stripping comments, collapsing whitespace, and removing trailing semicolons — which typically account for 20-40% savings on human-written CSS. A full CSS parser can additionally merge duplicate selectors, shorten color values (e.g. #ffffff to #fff), remove redundant properties, and optimize shorthand declarations. For most use cases, regex-based minification provides the majority of the benefit with zero dependencies and instant execution.",
			},
			{
				question: "What exactly does CSS minification strip from a stylesheet?",
				answer:
					"This tool removes three categories of non-functional content: block comments (/* ... */), unnecessary whitespace (spaces, tabs, newlines between rules and declarations), and trailing semicolons before closing braces (the last semicolon in a rule block is optional per the CSS spec). None of these changes affect how browsers interpret the stylesheet — the minified output renders identically to the original.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What is the origin of Cascading Style Sheets?",
		answer: (
			<>
				CSS was first proposed by H&aring;kon Wium Lie on October 10, 1994,
				while working at CERN alongside Tim Berners-Lee. The first official
				specification, CSS Level 1, was published as a W3C Recommendation in
				December 1996. Lie's proposal won out over several competing stylesheet
				languages because it allowed styles to cascade — letting author and user
				preferences blend rather than one overriding the other entirely. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/CSS"
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
		question:
			"What are the limitations of regex-based CSS minification compared to a full parser?",
		answer:
			"Regex-based minification handles the most impactful optimizations — stripping comments, collapsing whitespace, and removing trailing semicolons — which typically account for 20-40% savings on human-written CSS. A full CSS parser can additionally merge duplicate selectors, shorten color values (e.g. #ffffff to #fff), remove redundant properties, and optimize shorthand declarations. For most use cases, regex-based minification provides the majority of the benefit with zero dependencies and instant execution.",
	},
	{
		question: "What exactly does CSS minification strip from a stylesheet?",
		answer:
			"This tool removes three categories of non-functional content: block comments (/* ... */), unnecessary whitespace (spaces, tabs, newlines between rules and declarations), and trailing semicolons before closing braces (the last semicolon in a rule block is optional per the CSS spec). None of these changes affect how browsers interpret the stylesheet — the minified output renders identically to the original.",
	},
];

export default function CssFormatterPage() {
	return (
		<ToolPageLayout
			title="CSS Formatter"
			description="Minify or beautify CSS with size comparison — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CssFormatterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The CSS Formatter minifies or beautifies your stylesheets directly in
					the browser using regex-based processing. Paste CSS or upload a .css
					file to instantly strip comments and whitespace (minify) or reformat
					with consistent 2-space indentation (beautify). Size savings are shown
					in real time. Because this uses simple pattern matching rather than a
					full CSS parser, it won't restructure selectors or optimize values —
					but it handles the bulk of whitespace reduction with zero dependencies
					and no server round-trip.
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
				Processed using the browser's built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					String API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
