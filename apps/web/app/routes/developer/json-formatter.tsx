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
import type { Route } from "./+types/json-formatter";

const JsonFormatterTool = lazy(
	() => import("~/features/developer-tools/components/json-formatter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JSON Formatter Online — Free, Private, No Upload | NoUploads",
		description:
			"Validate, format, and minify JSON data instantly in your browser. Free, private, no server processing.",
		path: "/developer/json-formatter",
		keywords:
			"json formatter, json validator, json beautifier, json minifier, format json online, pretty print json, json lint, validate json",
		jsonLdName: "JSON Formatter",
		faq: [
			{
				question: "Who invented JSON?",
				answer:
					'JSON (JavaScript Object Notation) was popularized by Douglas Crockford in the early 2000s, though he has said he "discovered" rather than invented it — the syntax was already part of JavaScript since ECMAScript 3 in 1999. JSON was formalized as ECMA-404 in 2013 and has largely replaced XML as the dominant data interchange format for web APIs because of its simplicity and readability.',
			},
			{
				question:
					"What is the difference between formatting and minifying JSON?",
				answer:
					"Formatting (also called prettifying or beautifying) adds indentation and line breaks so the JSON is easy for humans to read and edit. Minifying removes all unnecessary whitespace, producing the most compact representation. Minified JSON is ideal for API payloads, configuration storage, and anywhere file size matters. Both operations preserve the data exactly — only whitespace changes.",
			},
			{
				question: "How large of a JSON file can this handle?",
				answer:
					"The tool accepts JSON input up to 10 MB of raw text. That covers most configuration files, API responses, and data exports. For very large datasets, performance depends on your browser and device — modern browsers handle multi-megabyte JSON without issue, though deeply nested structures with thousands of nodes may take a moment to process.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Who invented JSON?",
		answer: (
			<>
				JSON (JavaScript Object Notation) was popularized by Douglas Crockford
				in the early 2000s, though he has said he "discovered" rather than
				invented it — the syntax was already part of JavaScript since ECMAScript
				3 in 1999. JSON was formalized as ECMA-404 in 2013 and has largely
				replaced XML as the dominant data interchange format for web APIs
				because of its simplicity and readability. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/JSON"
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
		question: "What is the difference between formatting and minifying JSON?",
		answer:
			"Formatting (also called prettifying or beautifying) adds indentation and line breaks so the JSON is easy for humans to read and edit. Minifying removes all unnecessary whitespace, producing the most compact representation. Minified JSON is ideal for API payloads, configuration storage, and anywhere file size matters. Both operations preserve the data exactly — only whitespace changes.",
	},
	{
		question: "How large of a JSON file can this handle?",
		answer:
			"The tool accepts JSON input up to 10 MB of raw text. That covers most configuration files, API responses, and data exports. For very large datasets, performance depends on your browser and device — modern browsers handle multi-megabyte JSON without issue, though deeply nested structures with thousands of nodes may take a moment to process.",
	},
];

export default function JsonFormatterPage() {
	return (
		<ToolPageLayout
			title="JSON Formatter"
			description="Validate, format, and minify JSON data instantly — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<JsonFormatterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The JSON Formatter validates, prettifies, and minifies JSON data
					directly in your browser. Paste raw JSON or upload a .json file to
					instantly check for syntax errors, reformat with consistent
					indentation, or compress into a single line. Useful for debugging API
					responses, cleaning up configuration files, or preparing compact
					payloads. Everything runs client-side using the browser's native JSON
					API — no data is sent to any server, and there are no usage limits.
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
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					JSON API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
