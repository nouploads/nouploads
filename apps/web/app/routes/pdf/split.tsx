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
import type { Route } from "./+types/split";

const PdfSplitTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-split-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Split PDF Online — Free, Private, No Upload | NoUploads",
		description:
			"Split PDFs into individual pages or custom ranges. Runs in your browser — no upload, no server.",
		path: "/pdf/split",
		keywords:
			"split pdf, extract pdf pages, pdf splitter online free, separate pdf pages, split pdf by page range, private pdf splitter",
		jsonLdName: "PDF Splitter",
	});
}

const faqItems = [
	{
		question: "How do I split a PDF into separate pages?",
		answer:
			'Drop or select a PDF file, then choose "Individual pages" mode and click Split. Each page becomes its own PDF file, ready to download independently. The entire operation happens in your browser — your document is never uploaded anywhere.',
	},
	{
		question: "Can I extract specific page ranges from a PDF?",
		answer:
			'Yes. Switch to "Custom ranges" mode and enter page numbers or ranges separated by commas — for example, "1-3, 5, 7-10". Each comma-separated entry produces a separate PDF file. You can mix single pages and ranges in one operation.',
	},
	{
		question: "Is there a page or file size limit?",
		answer:
			"There is no hard limit. The tool runs locally in your browser, so capacity depends on your device. Most PDFs up to a few hundred pages split in seconds. Very large documents may take longer on mobile devices with limited memory.",
	},
	{
		question: "Does splitting preserve the original formatting?",
		answer:
			"Yes. The tool copies pages directly from the source PDF without re-rendering or re-compressing. Fonts, images, annotations, and form fields are preserved exactly as they appear in the original document.",
	},
	{
		question: "Why use NoUploads instead of other PDF split tools?",
		answer:
			"Other PDF splitters require you to upload sensitive documents to a remote server. NoUploads splits your PDF entirely in the browser using pdf-lib — nothing leaves your device. There are no file size limits, no watermarks, no signup required, and it works offline once the page has loaded. The tool is open source, so you can verify exactly what it does.",
	},
];

export default function SplitPdfPage() {
	return (
		<ToolPageLayout
			title="Split PDF"
			description="Extract individual pages or custom page ranges from a PDF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfSplitTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads PDF Splitter lets you break a PDF into individual pages or
					extract specific page ranges — all within your browser. Choose
					individual-page mode to get every page as a separate file, or enter
					custom ranges like "1-3, 5, 7-10" to produce targeted extracts. Pages
					are copied directly from the source document, so formatting, images,
					and fonts remain intact. Your files never leave your device.
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
					href="https://github.com/Hopding/pdf-lib"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					pdf-lib
				</a>{" "}
				&middot; MIT License
			</p>
		</ToolPageLayout>
	);
}
