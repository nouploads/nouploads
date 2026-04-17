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
import type { Route } from "./+types/xml-json";

const XmlJsonTool = lazy(
	() => import("~/features/developer-tools/components/xml-json-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "XML ↔ JSON Converter Online — Free, Instant | NoUploads",
		description:
			"Convert between XML and JSON in your browser with attribute preservation and auto format detection. No data leaves your device. Handles documents up to 10 MB.",
		path: "/developer/xml-json",
		keywords:
			"xml to json, json to xml, xml json converter, convert xml online, parse xml, xml beautifier, xml attributes, bidirectional converter",
		jsonLdName: "XML ↔ JSON Converter",
		faq: [
			{
				question: "Which standards body maintains XML?",
				answer:
					"XML was developed by a working group within the World Wide Web Consortium (W3C) and became a W3C Recommendation in February 1998. It was designed as a simplified subset of SGML (ISO 8879) so the same documents could travel over the Web and be processed by off-the-shelf parsers. The XML 1.0 specification is now in its Fifth Edition (2008), and XML remains the foundation for SVG, XHTML, Atom, SOAP, Office Open XML, and countless enterprise data formats.",
			},
			{
				question: "How are XML attributes represented in the JSON output?",
				answer:
					'Attributes are preserved with an `@_` prefix, so `<user id="42">` becomes `{ "@_id": "42" }` in the JSON. Text content of a mixed element is stored under `#text`. When converting back from JSON to XML, any key starting with `@_` is restored as an attribute on the parent element, and `#text` becomes the element\'s text content. This convention is the default of fast-xml-parser.',
			},
			{
				question: "Why do repeated elements become arrays?",
				answer:
					'JSON has no native concept of "multiple children with the same name" — each property can hold only one value. When the parser sees `<items><item>a</item><item>b</item></items>`, it collects the repeated `<item>` elements into a JSON array so no data is lost. On the way back out, any array value under a key is serialized as that many repeated XML elements.',
			},
			{
				question: "Is the conversion lossless?",
				answer:
					"For most documents, yes — elements, attributes, text content, and nesting all roundtrip correctly. Things that can't be perfectly preserved: XML comments, CDATA sections, processing instructions, DOCTYPE declarations, and the exact order of attributes (JSON object key order is not spec-guaranteed). If your document depends on those, convert only one way and keep the original.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Which standards body maintains XML?",
		answer: (
			<>
				XML was developed by a working group within the World Wide Web
				Consortium (W3C) and became a W3C Recommendation in February 1998. It
				was designed as a simplified subset of SGML (ISO 8879) so the same
				documents could travel over the Web and be processed by off-the-shelf
				parsers. The XML 1.0 specification is now in its Fifth Edition (2008),
				and XML remains the foundation for SVG, XHTML, Atom, SOAP, Office Open
				XML, and countless enterprise data formats. Source:{" "}
				<a
					href="https://www.w3.org/TR/xml/"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					W3C
				</a>
			</>
		),
	},
	{
		question: "How are XML attributes represented in the JSON output?",
		answer: (
			<>
				Attributes are preserved with an{" "}
				<code className="font-mono text-xs">@_</code> prefix, so{" "}
				<code className="font-mono text-xs">&lt;user id="42"&gt;</code> becomes{" "}
				<code className="font-mono text-xs">{'{ "@_id": "42" }'}</code> in the
				JSON. Text content of a mixed element is stored under{" "}
				<code className="font-mono text-xs">#text</code>. When converting back
				from JSON to XML, any key starting with{" "}
				<code className="font-mono text-xs">@_</code> is restored as an
				attribute on the parent element. This convention is the default of
				fast-xml-parser.
			</>
		),
	},
	{
		question: "Why do repeated elements become arrays?",
		answer:
			"JSON has no native concept of multiple children with the same name — each property can hold only one value. When the parser sees <items><item>a</item><item>b</item></items>, it collects the repeated item elements into a JSON array so no data is lost. On the way back out, any array value under a key is serialized as that many repeated XML elements.",
	},
	{
		question: "Is the conversion lossless?",
		answer:
			"For most documents, yes — elements, attributes, text content, and nesting all roundtrip correctly. Things that can't be perfectly preserved: XML comments, CDATA sections, processing instructions, DOCTYPE declarations, and the exact order of attributes (JSON object key order is not spec-guaranteed). If your document depends on those, convert only one way and keep the original.",
	},
];

export default function XmlJsonPage() {
	return (
		<ToolPageLayout
			title="XML ↔ JSON Converter"
			description="Convert between XML and JSON with attribute preservation — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<XmlJsonTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The XML ↔ JSON Converter turns XML documents into JSON and back,
					directly in your browser. Attributes survive the roundtrip via an{" "}
					<code className="font-mono text-xs">@_</code> key prefix, repeated
					elements become arrays, and the original structure is reproduced
					faithfully on the return trip. Upload a file or paste either format —
					the tool detects which side you're editing and runs the conversion
					automatically. Powered by fast-xml-parser, which handles XML
					declarations, self-closing tags, nested elements, and mixed content.
					Nothing is ever uploaded; all parsing happens client-side.
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
					href="https://github.com/NaturalIntelligence/fast-xml-parser"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					fast-xml-parser
				</a>{" "}
				· MIT
			</p>
		</ToolPageLayout>
	);
}
