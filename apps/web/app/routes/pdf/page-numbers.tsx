import { lazy, Suspense } from "react";
import { LibraryAttribution } from "~/components/tool/library-attribution";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/page-numbers";

const PdfPageNumbersTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-page-numbers-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Add Page Numbers to PDF Online — Free, Private, No Upload | NoUploads",
		description:
			"Insert page numbers on every page of a PDF. Choose position, format, and font size. Runs in your browser — no upload required.",
		path: "/pdf/page-numbers",
		keywords:
			"add page numbers to pdf, pdf page numbers, number pdf pages, pdf page numbering online, free pdf page number tool, insert page numbers pdf",
		jsonLdName: "PDF Page Numbers Tool",
		faq: [
			{
				question: "What's the story behind page numbering in books?",
				answer:
					"Page numbering became widespread in European printed books during the late 15th century, shortly after Gutenberg introduced movable type around 1440. Early manuscripts had no page numbers at all — readers navigated by chapter headings or catchwords. Aldus Manutius, the Venetian printer who also invented italic type and the modern semicolon, was among the first to use Arabic numerals for pagination in the 1490s, establishing a convention that has persisted for over five centuries.",
			},
			{
				question: "What page number formats are available?",
				answer:
					'You can choose from five formats: plain numbers (1, 2, 3), "Page N" labels, "N of Total" counters, "Page N of Total" labels, or lowercase Roman numerals (i, ii, iii). You can also set a custom starting number and skip the first page for documents with a title page.',
			},
			{
				question: "Can I place numbers in different positions on the page?",
				answer:
					"Yes. Six positions are available: top-left, top-center, top-right, bottom-left, bottom-center, and bottom-right. A margin slider lets you fine-tune how far from the edge the numbers appear, from 20 to 100 points.",
			},
			{
				question: "Does this work with scanned or image-based PDFs?",
				answer:
					"Yes. The tool adds text directly to the PDF page layer regardless of whether the pages contain searchable text, scanned images, or vector graphics. The page numbers are drawn on top of whatever content already exists.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What's the story behind page numbering in books?",
		answer: (
			<>
				Page numbering became widespread in European printed books during the
				late 15th century, shortly after Gutenberg introduced movable type
				around 1440. Early manuscripts had no page numbers at all — readers
				navigated by chapter headings or catchwords. Aldus Manutius, the
				Venetian printer who also invented italic type and the modern semicolon,
				was among the first to use Arabic numerals for pagination in the 1490s,
				establishing a convention that has persisted for over five centuries.{" "}
				Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Page_numbering"
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
		question: "What page number formats are available?",
		answer:
			'You can choose from five formats: plain numbers (1, 2, 3), "Page N" labels, "N of Total" counters, "Page N of Total" labels, or lowercase Roman numerals (i, ii, iii). You can also set a custom starting number and skip the first page for documents with a title page.',
	},
	{
		question: "Can I place numbers in different positions on the page?",
		answer:
			"Yes. Six positions are available: top-left, top-center, top-right, bottom-left, bottom-center, and bottom-right. A margin slider lets you fine-tune how far from the edge the numbers appear, from 20 to 100 points.",
	},
	{
		question: "Does this work with scanned or image-based PDFs?",
		answer:
			"Yes. The tool adds text directly to the PDF page layer regardless of whether the pages contain searchable text, scanned images, or vector graphics. The page numbers are drawn on top of whatever content already exists.",
	},
];

export default function PageNumbersPdfPage() {
	return (
		<ToolPageLayout
			title="Add Page Numbers to PDF"
			description="Insert page numbers on every page of a PDF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfPageNumbersTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool inserts page numbers into any PDF document directly in your
					browser. You choose where the numbers appear, pick from several common
					numbering formats, and adjust font size and margin. It handles
					multi-page documents of any length and supports skipping the first
					page for title pages. All processing uses pdf-lib client-side, so your
					files remain private.
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

			<LibraryAttribution packages={["pdf-lib"]} />
		</ToolPageLayout>
	);
}
