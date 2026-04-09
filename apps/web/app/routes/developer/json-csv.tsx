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
import type { Route } from "./+types/json-csv";

const JsonCsvTool = lazy(
	() => import("~/features/developer-tools/components/json-csv-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JSON to CSV Converter — Free, Instant | NoUploads",
		description:
			"Convert JSON arrays to CSV and back in your browser — free, RFC 4180 compliant with dot-notation flattening. No data sent to any server. Handles quoted fields.",
		path: "/developer/json-csv",
		keywords:
			"json to csv, csv to json, json csv converter, convert json array to csv, flatten nested json, rfc 4180, csv export, data format converter",
		jsonLdName: "JSON to CSV Converter",
		faq: [
			{
				question: "When was the CSV format first used in computing?",
				answer:
					"CSV (Comma-Separated Values) has been used since at least 1972 on IBM Fortran compilers, over a decade before personal computers became common. Despite its age and ubiquity, CSV was not formally standardized until RFC 4180 was published in 2005. The format's simplicity — plain text with a delimiter — is exactly why it has outlasted more complex data interchange formats in many workflows.",
			},
			{
				question: "How does dot-notation flattening work for nested JSON?",
				answer:
					'When "Flatten nested" is enabled, nested objects are collapsed into a single level using dot-separated keys. For example, {"user":{"address":{"city":"Paris"}}} becomes a column named "user.address.city" with the value "Paris". Arrays are serialized as JSON strings rather than flattened, because arrays don\'t map cleanly to a single CSV column. This approach preserves all data while keeping the CSV readable in spreadsheet software.',
			},
			{
				question:
					"How are commas and newlines inside values handled in the CSV output?",
				answer:
					'The converter follows RFC 4180 quoting rules: any field containing the delimiter character, double quotes, or line breaks is wrapped in double quotes. Double quotes inside a field are escaped by doubling them (""). This means a JSON value like "hello, world" becomes the CSV field "hello, world" (wrapped in quotes), which Excel, Google Sheets, and other tools parse correctly without splitting the field.',
			},
		],
	});
}

const faqItems = [
	{
		question: "When was the CSV format first used in computing?",
		answer: (
			<>
				CSV (Comma-Separated Values) has been used since at least 1972 on IBM
				Fortran compilers, over a decade before personal computers became
				common. Despite its age and ubiquity, CSV was not formally standardized
				until RFC 4180 was published in 2005. The format's simplicity — plain
				text with a delimiter — is exactly why it has outlasted more complex
				data interchange formats in many workflows. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Comma-separated_values"
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
		question: "How does dot-notation flattening work for nested JSON?",
		answer:
			'When "Flatten nested" is enabled, nested objects are collapsed into a single level using dot-separated keys. For example, {"user":{"address":{"city":"Paris"}}} becomes a column named "user.address.city" with the value "Paris". Arrays are serialized as JSON strings rather than flattened, because arrays don\'t map cleanly to a single CSV column. This approach preserves all data while keeping the CSV readable in spreadsheet software.',
	},
	{
		question:
			"How are commas and newlines inside values handled in the CSV output?",
		answer:
			'The converter follows RFC 4180 quoting rules: any field containing the delimiter character, double quotes, or line breaks is wrapped in double quotes. Double quotes inside a field are escaped by doubling them (""). This means a JSON value like "hello, world" becomes the CSV field "hello, world" (wrapped in quotes), which Excel, Google Sheets, and other tools parse correctly without splitting the field.',
	},
];

export default function JsonCsvPage() {
	return (
		<ToolPageLayout
			title="JSON ↔ CSV Converter"
			description="Convert between JSON arrays and CSV with nested object flattening — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<JsonCsvTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The JSON to CSV Converter transforms JSON arrays of objects into RFC
					4180 compliant CSV, and converts CSV spreadsheet data back into
					structured JSON. Ideal for developers exporting API responses into
					Excel or Google Sheets, data analysts moving tabular data into code,
					or anyone bridging the gap between structured data and spreadsheets.
					Nested JSON objects are automatically flattened using dot notation so
					every value maps to a clean column header. Everything runs in your
					browser — no data is sent to any server.
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
