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
import type { Route } from "./+types/pdf-to-text";

const PdfToTextTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-to-text-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Extract Text from PDF Online — Free, Private, No Upload | NoUploads",
		description:
			"Extract all text from PDF documents in your browser. Copy or download as .txt. No upload required.",
		path: "/pdf/pdf-to-text",
		keywords:
			"pdf to text, extract text from pdf, pdf text extractor, copy text from pdf, pdf to txt online, free pdf text tool, private pdf extractor",
		jsonLdName: "PDF to Text Extractor",
	});
}

const faqItems = [
	{
		question: "How does PDF text extraction work?",
		answer:
			"Your PDF is parsed entirely in the browser using PDF.js, the same rendering engine that powers Firefox's built-in PDF viewer. Each page's text layer is read and assembled into plain text. The PDF file never leaves your device — there's no server involved.",
	},
	{
		question: "What if my PDF contains only scanned images?",
		answer:
			"This tool extracts text that is embedded in the PDF's text layer. Scanned documents that are essentially images of text won't yield results unless the PDF was processed with OCR beforehand. If you see 'No extractable text found,' the PDF likely contains only images.",
	},
	{
		question: "Does this tool preserve formatting?",
		answer:
			"The extracted text preserves the reading order and line breaks from the original PDF. However, complex layouts like multi-column text, tables, or decorative formatting may not translate perfectly to plain text. The output is clean, readable text suitable for copying into other documents.",
	},
	{
		question: "Can I extract text from password-protected PDFs?",
		answer:
			"No. If your PDF requires a password to open, you'll need to remove the password protection first using your PDF reader's security settings, then upload the unprotected version here.",
	},
	{
		question: "Why use NoUploads instead of other PDF text extractors?",
		answer:
			"Most PDF text extraction tools require uploading your document to a remote server — a real concern when working with contracts, financial records, or personal files. NoUploads runs the entire extraction locally in your browser using PDF.js. Nothing is uploaded, no data is collected, and the tool works offline once loaded. It's free, has no page limits, requires no account, and the code is fully open source.",
	},
];

export default function PdfToTextPage() {
	return (
		<ToolPageLayout
			title="PDF to Text"
			description="Extract all text content from PDF documents — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfToTextTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool reads every page of your PDF and pulls out the embedded text
					content, giving you clean plain text you can copy or download as a
					.txt file. It handles multi-page documents automatically, showing page
					separators and a total character count. Because all parsing happens
					client-side via PDF.js, your documents remain completely private — no
					file ever touches a server.
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
					href="https://github.com/mozilla/pdf.js"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					PDF.js
				</a>{" "}
				&middot; Apache-2.0 License
			</p>
		</ToolPageLayout>
	);
}
