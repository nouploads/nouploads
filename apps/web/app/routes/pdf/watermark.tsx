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
		faq: [
			{
				question: "How do PDF watermarks differ from image watermarks?",
				answer:
					"Unlike image watermarks that permanently alter pixel data, PDF watermarks are implemented as a separate semi-transparent layer of drawing commands overlaid on each page's content stream. The original page content remains untouched underneath — which is why PDF watermarks can theoretically be added and removed without degrading the document. This layered approach is possible because PDF natively supports transparency compositing.",
			},
			{
				question: "Can I customize the watermark appearance?",
				answer:
					'Yes. You can change the watermark text (default is "CONFIDENTIAL"), font size (20–120px), opacity (10%–100%), rotation angle (-90° to 90°), and color. All changes are applied live, so you can experiment until it looks right.',
			},
			{
				question: "Can I remove a watermark added with this tool?",
				answer:
					"The watermark is drawn directly into the PDF content stream, similar to how a printer stamps text on paper. It cannot be removed with a simple toggle. If you need the original, keep a copy of your unwatermarked file before processing.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How do PDF watermarks differ from image watermarks?",
		answer: (
			<>
				Unlike image watermarks that permanently alter pixel data, PDF
				watermarks are implemented as a separate semi-transparent layer of
				drawing commands overlaid on each page's content stream. The original
				page content remains untouched underneath — which is why PDF watermarks
				can theoretically be added and removed without degrading the document.
				This layered approach is possible because PDF natively supports
				transparency compositing. Source:{" "}
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
		question: "Can I customize the watermark appearance?",
		answer:
			'Yes. You can change the watermark text (default is "CONFIDENTIAL"), font size (20–120px), opacity (10%–100%), rotation angle (-90° to 90°), and color. All changes are applied live, so you can experiment until it looks right.',
	},
	{
		question: "Can I remove a watermark added with this tool?",
		answer:
			"The watermark is drawn directly into the PDF content stream, similar to how a printer stamps text on paper. It cannot be removed with a simple toggle. If you need the original, keep a copy of your unwatermarked file before processing.",
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
