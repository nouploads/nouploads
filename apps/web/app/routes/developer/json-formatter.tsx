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
	});
}

const faqItems = [
	{
		question: "How does the JSON formatter work?",
		answer:
			"The formatter uses your browser's built-in JSON.parse() to validate the input and JSON.stringify() with indentation to produce clean, readable output. Parsing catches syntax errors instantly — missing commas, unquoted keys, trailing commas, and mismatched brackets are all flagged with a clear error message. No data is sent anywhere.",
	},
	{
		question: "What is the difference between formatting and minifying JSON?",
		answer:
			"Formatting (also called prettifying or beautifying) adds indentation and line breaks so the JSON is easy for humans to read and edit. Minifying removes all unnecessary whitespace, producing the most compact representation. Minified JSON is ideal for API payloads, configuration storage, and anywhere file size matters. Both operations preserve the data exactly — only whitespace changes.",
	},
	{
		question: "Is there a file size limit?",
		answer:
			"The tool accepts JSON input up to 10 MB of raw text. That covers most configuration files, API responses, and data exports. For very large datasets, performance depends on your browser and device — modern browsers handle multi-megabyte JSON without issue, though deeply nested structures with thousands of nodes may take a moment to process.",
	},
	{
		question: "Can I upload a .json file instead of pasting?",
		answer:
			"Yes. Click the 'Upload .json' button or drag and drop a file directly onto the editor. The file is read locally using the browser's FileReader API — it never leaves your device. Once loaded, you can format, minify, or edit the JSON just like pasted text.",
	},
	{
		question: "Why use NoUploads instead of other JSON formatters?",
		answer:
			"Many online JSON tools send your data to a server for processing, which means sensitive configuration files, API keys, and private data pass through third-party infrastructure. NoUploads processes everything client-side — your JSON never leaves your browser tab. There is no server, no analytics on your input, no account required, and no usage limits. It works offline after the first load, and the code is open source.",
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
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					JSON API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
