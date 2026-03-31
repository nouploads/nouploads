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
import type { Route } from "./+types/case-converter";

const CaseConverterTool = lazy(
	() => import("~/features/developer-tools/components/case-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Case Converter Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert text between camelCase, snake_case, kebab-case, PascalCase, UPPERCASE and more. Free, private, runs in your browser.",
		path: "/developer/case-converter",
		keywords:
			"case converter, camelCase, snake_case, kebab-case, PascalCase, CONSTANT_CASE, text case converter online, naming convention converter, variable name converter",
		jsonLdName: "Case Converter",
		faq: [
			{
				question: "Where does the name camelCase come from?",
				answer:
					"The term camelCase gets its name from the uppercase letters in the middle of a compound word, which resemble the humps of a camel. The convention dates back to at least the 1970s in programming communities, and was popularized by Smalltalk and later by Java and JavaScript. The related PascalCase variant (where the first letter is also capitalized) is named after the Pascal programming language, which used it for identifiers.",
			},
			{
				question:
					"How does the converter detect word boundaries in camelCase input?",
				answer:
					"The converter splits camelCase and PascalCase strings by detecting transitions from a lowercase letter to an uppercase letter (e.g. the W in helloWorld). It also handles uppercase acronyms like HTTP by detecting runs of capitals followed by an uppercase-then-lowercase pair (e.g. parseHTTPResponse splits into parse, HTTP, Response). Hyphens, underscores, dots, and spaces are also recognized as word separators.",
			},
			{
				question:
					"What happens to special characters and numbers during conversion?",
				answer:
					"Numbers are kept attached to the word they appear in — for example, version2update is treated as one word. Punctuation and special characters that are not word separators (hyphens, underscores, dots, spaces) are preserved within their word segment. If you convert getV2Data to snake_case, the result is get_v2_data because the camelCase boundary detection splits on letter case transitions, not on digit boundaries.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Where does the name camelCase come from?",
		answer: (
			<>
				The term camelCase gets its name from the uppercase letters in the
				middle of a compound word, which resemble the humps of a camel. The
				convention dates back to at least the 1970s in programming communities,
				and was popularized by Smalltalk and later by Java and JavaScript. The
				related PascalCase variant (where the first letter is also capitalized)
				is named after the Pascal programming language, which used it for
				identifiers. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Camel_case"
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
			"How does the converter detect word boundaries in camelCase input?",
		answer:
			"The converter splits camelCase and PascalCase strings by detecting transitions from a lowercase letter to an uppercase letter (e.g. the W in helloWorld). It also handles uppercase acronyms like HTTP by detecting runs of capitals followed by an uppercase-then-lowercase pair (e.g. parseHTTPResponse splits into parse, HTTP, Response). Hyphens, underscores, dots, and spaces are also recognized as word separators.",
	},
	{
		question:
			"What happens to special characters and numbers during conversion?",
		answer:
			"Numbers are kept attached to the word they appear in — for example, version2update is treated as one word. Punctuation and special characters that are not word separators (hyphens, underscores, dots, spaces) are preserved within their word segment. If you convert getV2Data to snake_case, the result is get_v2_data because the camelCase boundary detection splits on letter case transitions, not on digit boundaries.",
	},
];

export default function CaseConverterPage() {
	return (
		<ToolPageLayout
			title="Case Converter"
			description="Convert text between camelCase, snake_case, kebab-case, and 7 more styles — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CaseConverterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Case Converter transforms text between ten naming conventions used
					across programming languages, APIs, and configuration files. Paste a
					variable name, sentence, or block of text and instantly see it
					converted to camelCase, PascalCase, snake_case, kebab-case,
					CONSTANT_CASE, dot.case, Title Case, Sentence case, UPPERCASE, and
					lowercase. Handy when switching between Python's snake_case and
					JavaScript's camelCase, or renaming database columns to match an API
					schema. Everything runs in your browser — your text never leaves your
					machine.
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
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String"
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
