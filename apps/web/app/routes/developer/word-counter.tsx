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
import type { Route } from "./+types/word-counter";

const WordCounterTool = lazy(
	() => import("~/features/developer-tools/components/word-counter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Word Counter Online — Free, Instant | NoUploads",
		description:
			"Count characters, words, sentences, and paragraphs in your browser — free, with reading time at 238 wpm. No data sent to any server. Results update as you type.",
		path: "/developer/word-counter",
		keywords:
			"word counter, character counter, text analysis, word count online, reading time, sentence counter, paragraph counter",
		jsonLdName: "Word Counter",
		faq: [
			{
				question:
					"Where does the 238 words-per-minute reading speed come from?",
				answer:
					"The 238 wpm figure comes from a 2019 meta-analysis by Marc Brysbaert that synthesized 190 studies on silent reading in English. The study found that the commonly cited 300 wpm figure was too high, and that 238 wpm better represents the average adult reading rate for non-fiction material.",
			},
			{
				question:
					"How does the word counter calculate reading time from word count?",
				answer:
					"The tool divides the total word count by 238 (the average adult silent reading speed). Anything under 238 words shows as less than 1 minute. The estimate rounds to the nearest whole minute — so 500 words shows approximately 2 minutes. This is an approximation; actual speed varies with text complexity and the reader.",
			},
			{
				question:
					"How does this tool detect sentence and paragraph boundaries?",
				answer:
					"Sentences are split on terminal punctuation marks (period, exclamation mark, question mark). Consecutive punctuation like '?!' counts as a single boundary. Paragraphs are detected by double line breaks — two or more consecutive newlines signal a new paragraph. A single line break without an empty line between is treated as part of the same paragraph.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Where does the 238 words-per-minute reading speed come from?",
		answer: (
			<>
				The 238 wpm figure comes from a 2019 meta-analysis by Marc Brysbaert
				that synthesized 190 studies on silent reading in English. The study
				found that the commonly cited 300 wpm figure was too high, and that 238
				wpm better represents the average adult reading rate for non-fiction
				material. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Reading#Reading_rate"
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
			"How does the word counter calculate reading time from word count?",
		answer:
			"The tool divides the total word count by 238 (the average adult silent reading speed). Anything under 238 words shows as less than 1 minute. The estimate rounds to the nearest whole minute — so 500 words shows approximately 2 minutes. This is an approximation; actual speed varies with text complexity and the reader.",
	},
	{
		question: "How does this tool detect sentence and paragraph boundaries?",
		answer:
			"Sentences are split on terminal punctuation marks (period, exclamation mark, question mark). Consecutive punctuation like '?!' counts as a single boundary. Paragraphs are detected by double line breaks — two or more consecutive newlines signal a new paragraph. A single line break without an empty line between is treated as part of the same paragraph.",
	},
];

export default function WordCounterPage() {
	return (
		<ToolPageLayout
			title="Word Counter"
			description="Count characters, words, sentences, and paragraphs with reading time — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<WordCounterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Word Counter analyzes any text you paste or type, giving you
					instant counts for characters (with and without spaces), words,
					sentences, and paragraphs — plus an estimated reading time based on
					238 words per minute. It is useful for writers checking essay
					requirements, students meeting assignment limits, content creators
					optimizing blog post length, or anyone who needs quick text
					statistics. Everything runs locally in your browser — no text is sent
					to any server, and there are no usage limits.
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
