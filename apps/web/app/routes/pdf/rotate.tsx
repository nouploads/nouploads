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
import type { Route } from "./+types/rotate";

const PdfRotateTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-rotate-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Rotate PDF Online — Free, Private, No Upload | NoUploads",
		description:
			"Rotate PDF pages by 90, 180, or 270 degrees. Runs in your browser — no upload, no server.",
		path: "/pdf/rotate",
		keywords:
			"rotate pdf, rotate pdf pages, pdf rotation online, turn pdf sideways, flip pdf upside down, free pdf rotator",
		jsonLdName: "PDF Rotator",
	});
}

const faqItems = [
	{
		question: "How does PDF handle page rotation internally?",
		answer: (
			<>
				PDF pages have a built-in rotation property stored in their page
				dictionary — a simple value of 0, 90, 180, or 270 degrees. Changing this
				value rotates the entire page display without modifying any of the
				actual page content: text, images, and vector graphics all stay
				untouched. This is why PDF rotation is instant and completely lossless,
				regardless of how complex the page may be.{" "}
				<a
					href="https://en.wikipedia.org/wiki/PDF"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Source: Wikipedia
				</a>
			</>
		),
	},
	{
		question: "Can I rotate individual pages?",
		answer:
			"This tool currently rotates all pages in the PDF by the same angle. If you need to rotate only specific pages, split the PDF first, rotate the pages you need, then merge the files back together using the Merge PDFs tool.",
	},
	{
		question: "Does rotating a PDF change the content or quality?",
		answer:
			"No. Rotation is a lossless metadata change — it adjusts the page orientation flag without re-encoding images, text, or vector graphics. Your content stays pixel-perfect.",
	},
	{
		question: "What about scanned or landscape PDFs?",
		answer:
			"Scanned documents and landscape-oriented PDFs rotate the same way. If your scanner saved pages sideways, a 90° or 270° rotation will fix the orientation without any quality loss.",
	},
];

export default function RotatePdfPage() {
	return (
		<ToolPageLayout
			title="Rotate PDF"
			description="Rotate all pages of a PDF by 90, 180, or 270 degrees — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfRotateTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads PDF Rotator lets you fix the orientation of PDF pages
					directly in your browser. Choose between 90° clockwise, 180°, or 90°
					counter-clockwise rotation and download the corrected file instantly.
					The rotation is applied as a lossless page-level property — no
					re-rendering, no image degradation, no quality loss. Ideal for fixing
					sideways scans, landscape documents, or upside-down pages. Everything
					runs client-side with pdf-lib, so your documents never touch a server.
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
				&middot; MIT License
			</p>
		</ToolPageLayout>
	);
}
