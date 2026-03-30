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
import type { Route } from "./+types/watermark";

const PdfWatermarkTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-watermark-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Watermark PDF Online — Free, Private, No Upload | NoUploads",
		description:
			"Add a text watermark to every page of a PDF. Customize text, size, opacity, rotation, and color. Free, private, no upload.",
		path: "/pdf/watermark",
		keywords:
			"watermark pdf, add watermark to pdf, pdf watermark online, stamp pdf, pdf text overlay, free pdf watermark tool, private pdf watermark",
		jsonLdName: "PDF Watermark Tool",
	});
}

const faqItems = [
	{
		question: "How does the PDF watermark tool work?",
		answer:
			"The tool loads your PDF in the browser using pdf-lib, then draws the watermark text on every page at the position, size, opacity, and angle you choose. The modified PDF is saved and made available for download — no server ever sees your document.",
	},
	{
		question: "Can I customize the watermark appearance?",
		answer:
			'Yes. You can change the watermark text (default is "CONFIDENTIAL"), font size (20–120px), opacity (10%–100%), rotation angle (-90° to 90°), and color. All changes are applied live, so you can experiment until it looks right.',
	},
	{
		question: "Does the watermark appear on every page?",
		answer:
			"Yes, the watermark is applied to every page of the PDF. Each page receives the same text, centered on the page, using the settings you configure.",
	},
	{
		question: "Can I remove a watermark added with this tool?",
		answer:
			"The watermark is drawn directly into the PDF content stream, similar to how a printer stamps text on paper. It cannot be removed with a simple toggle. If you need the original, keep a copy of your unwatermarked file before processing.",
	},
	{
		question: "Why use NoUploads instead of other PDF watermark tools?",
		answer:
			"Watermarking often involves sensitive documents — contracts, reports, legal drafts — that you wouldn't want on someone else's server. NoUploads processes the PDF entirely inside your browser, so the file never leaves your device. There are no daily limits, no account required, no watermarks on the watermark tool itself, and it works offline once loaded. The source code is open for anyone to inspect.",
	},
];

export default function WatermarkPdfPage() {
	return (
		<ToolPageLayout
			title="Watermark PDF"
			description="Add a text watermark to every page of a PDF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfWatermarkTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool stamps a customizable text watermark onto every page of your
					PDF. You control the wording, font size, transparency, angle, and
					color — making it useful for marking drafts, confidential documents,
					or pre-release materials. Processing happens entirely in your browser
					using pdf-lib, so your documents stay private and never touch a remote
					server.
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
