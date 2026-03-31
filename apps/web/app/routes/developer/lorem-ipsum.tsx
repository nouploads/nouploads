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
import type { Route } from "./+types/lorem-ipsum";

const LoremIpsumTool = lazy(
	() => import("~/features/developer-tools/components/lorem-ipsum-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Lorem Ipsum Generator Online — Free, Private, No Upload | NoUploads",
		description:
			"Generate placeholder text instantly — paragraphs, sentences, or exact word counts. Free, private, no server.",
		path: "/developer/lorem-ipsum",
		keywords:
			"lorem ipsum generator, placeholder text, dummy text, lipsum, filler text, sample text",
		jsonLdName: "Lorem Ipsum Generator",
		faq: [
			{
				question: "Where does lorem ipsum come from?",
				answer:
					'The text originated from Cicero\'s philosophical work "De Finibus Bonorum et Malorum" written in 45 BC. A garbled version has been used as typesetting placeholder text since the 1500s, when an unknown printer scrambled it for a type specimen book. It became widespread in the 1960s with Letraset dry-transfer sheets.',
			},
			{
				question: "Why does the generator offer an exact word count mode?",
				answer:
					"Designers and developers frequently need precise word counts to fill layout mockups — a 50-word bio field or a 200-word product description, for example. The word count mode generates exactly the number of words you request, making it easy to test text overflow, line wrapping, and responsive breakpoints with realistic content length.",
			},
			{
				question: "How are the paragraphs assembled?",
				answer:
					'Each paragraph is assembled by randomly selecting 4 to 8 sentences from a corpus of classical Latin phrases drawn from the traditional lorem ipsum text. This produces natural variation in paragraph length while keeping the text recognizable as standard placeholder copy. When the classic start option is enabled, the first paragraph always opens with the familiar "Lorem ipsum dolor sit amet" line.',
			},
		],
	});
}

const faqItems = [
	{
		question: "Where does lorem ipsum come from?",
		answer: (
			<>
				The text originated from Cicero's philosophical work "De Finibus Bonorum
				et Malorum" written in 45 BC. A garbled version has been used as
				typesetting placeholder text since the 1500s, when an unknown printer
				scrambled it for a type specimen book. It became widespread in the 1960s
				with Letraset dry-transfer sheets. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Lorem_ipsum"
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
		question: "Why does the generator offer an exact word count mode?",
		answer:
			"Designers and developers frequently need precise word counts to fill layout mockups — a 50-word bio field or a 200-word product description, for example. The word count mode generates exactly the number of words you request, making it easy to test text overflow, line wrapping, and responsive breakpoints with realistic content length.",
	},
	{
		question: "How are the paragraphs assembled?",
		answer:
			'Each paragraph is assembled by randomly selecting 4 to 8 sentences from a corpus of classical Latin phrases drawn from the traditional lorem ipsum text. This produces natural variation in paragraph length while keeping the text recognizable as standard placeholder copy. When the classic start option is enabled, the first paragraph always opens with the familiar "Lorem ipsum dolor sit amet" line.',
	},
];

export default function LoremIpsumPage() {
	return (
		<ToolPageLayout
			title="Lorem Ipsum Generator"
			description="Generate placeholder text for mockups and layouts — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<LoremIpsumTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Lorem Ipsum Generator produces classical Latin placeholder text in
					three modes: full paragraphs, individual sentences, or an exact word
					count. It draws from the traditional "De Finibus" corpus that
					typesetters have used since the 1500s, so the output looks natural in
					any design mockup. Everything runs in your browser with no server
					calls, and you can copy or download the result instantly.
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
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Math API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
