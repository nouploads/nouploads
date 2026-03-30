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
import type { Route } from "./+types/merge";

const PdfMergeTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-merge-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Merge PDF Files Online — Free, Private, No Upload | NoUploads",
		description:
			"Combine multiple PDFs into one file. Drag to reorder, then merge. No upload — runs in your browser.",
		path: "/pdf/merge",
		keywords:
			"merge pdf, combine pdf, join pdf files, merge pdf online free, private pdf merger, pdf combiner",
		jsonLdName: "PDF Merger",
	});
}

const faqItems = [
	{
		question: "How do I merge PDF files?",
		answer:
			"Drop or select the PDF files you want to combine. Reorder them using the arrow buttons, then click the Merge button. The merged PDF is assembled entirely in your browser and ready to download in seconds.",
	},
	{
		question: "Can I reorder pages before merging?",
		answer:
			"Yes. After adding your files, use the up and down arrow buttons next to each file to rearrange the order. Files are merged top to bottom, so the first file in the list becomes the first pages of the output.",
	},
	{
		question: "Is there a file size or page limit?",
		answer:
			"There is no hard limit — the tool runs in your browser, so it depends on your device's available memory. Most users can merge dozens of PDFs totaling hundreds of pages without issues. Very large merges (thousands of pages) may be slow on mobile devices.",
	},
	{
		question: "What about encrypted or password-protected PDFs?",
		answer:
			"The tool can read many encrypted PDFs that don't require a password to open (owner-password-only encryption). PDFs that require a user password to open cannot be merged — you'll see an error for that specific file.",
	},
	{
		question: "Why use NoUploads instead of other PDF merge tools?",
		answer:
			"Most online PDF mergers upload your documents to remote servers — a real concern when your files contain contracts, medical records, or financial data. NoUploads processes everything locally in your browser using pdf-lib. Your files never leave your device, there is no server involved, and it works even without an internet connection after the page loads. It's free with no signup, no file limits, and fully open source.",
	},
];

export default function MergePdfPage() {
	return (
		<ToolPageLayout
			title="Merge PDFs"
			description="Combine multiple PDF files into a single document — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfMergeTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads PDF Merger lets you combine two or more PDF documents into a
					single file directly in your browser. Reorder files before merging,
					preview page counts, and download the result instantly. It handles
					multi-page documents, scanned PDFs, and form-filled files alike. Your
					documents stay on your device throughout the entire process — nothing
					is sent to any server.
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
