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
import type { Route } from "./+types/reorder";

const PdfReorderTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-reorder-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Reorder PDF Pages Online — Free, Private, No Upload | NoUploads",
		description:
			"Drag and drop to rearrange PDF pages or remove unwanted pages. Free, private, processes entirely in your browser.",
		path: "/pdf/reorder",
		keywords:
			"reorder pdf pages, rearrange pdf, sort pdf pages, remove pdf pages, drag drop pdf, organize pdf pages, pdf page order",
		jsonLdName: "PDF Page Reorder",
		faq: [
			{
				question:
					"What was the original purpose of the PDF format when Adobe created it?",
				answer:
					"Adobe co-founder John Warnock launched the Camelot project in 1991 to solve a specific problem: reliably sharing documents between different computer systems without losing formatting. The result was PDF, first released in 1993 as a proprietary format. It became an open ISO standard (ISO 32000) in 2008, which is why every PDF viewer today can open files created decades ago.",
			},
			{
				question: "How does drag-and-drop page reordering work in this tool?",
				answer:
					"The tool renders a thumbnail preview of every page using PDF.js, then uses the browser's native HTML Drag and Drop API to let you rearrange them visually. When you click Download, pdf-lib copies pages from the original PDF in your new order into a fresh document. No re-rendering or quality loss occurs because pages are copied as structured PDF objects, not flattened images.",
			},
			{
				question: "Does reordering preserve bookmarks, links, and form fields?",
				answer:
					"pdf-lib copies each page as a self-contained PDF object, so text, vector graphics, embedded images, and annotations travel with the page. However, cross-page bookmarks and internal hyperlinks that reference specific page destinations may break if the target page has moved or been removed. External links and form fields within a single page are preserved.",
			},
		],
	});
}

const faqItems = [
	{
		question:
			"What was the original purpose of the PDF format when Adobe created it?",
		answer: (
			<>
				Adobe co-founder John Warnock launched the Camelot project in 1991 to
				solve a specific problem: reliably sharing documents between different
				computer systems without losing formatting. The result was PDF, first
				released in 1993 as a proprietary format. It became an open ISO standard
				(ISO 32000) in 2008, which is why every PDF viewer today can open files
				created decades ago. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/PDF"
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
		question: "How does drag-and-drop page reordering work in this tool?",
		answer:
			"The tool renders a thumbnail preview of every page using PDF.js, then uses the browser's native HTML Drag and Drop API to let you rearrange them visually. When you click Download, pdf-lib copies pages from the original PDF in your new order into a fresh document. No re-rendering or quality loss occurs because pages are copied as structured PDF objects, not flattened images.",
	},
	{
		question: "Does reordering preserve bookmarks, links, and form fields?",
		answer:
			"pdf-lib copies each page as a self-contained PDF object, so text, vector graphics, embedded images, and annotations travel with the page. However, cross-page bookmarks and internal hyperlinks that reference specific page destinations may break if the target page has moved or been removed. External links and form fields within a single page are preserved.",
	},
];

export default function ReorderPdfPage() {
	return (
		<ToolPageLayout
			title="Reorder PDF Pages"
			description="Drag and drop to rearrange or remove PDF pages — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfReorderTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads PDF Page Reorder lets you visually rearrange pages in any
					PDF document by dragging thumbnail previews into a new sequence. You
					can also remove unwanted pages with a single click. Ideal for fixing
					page order in scanned documents, reorganizing reports, or stripping
					cover sheets before sharing. The tool uses pdf-lib to copy pages as
					structured objects — no re-rendering, no quality loss — and everything
					runs client-side so your documents stay private.
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
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					pdf-lib
				</a>{" "}
				&middot; MIT &amp;{" "}
				<a
					href="https://github.com/mozilla/pdf.js"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					PDF.js
				</a>{" "}
				&middot; Apache-2.0
			</p>
		</ToolPageLayout>
	);
}
