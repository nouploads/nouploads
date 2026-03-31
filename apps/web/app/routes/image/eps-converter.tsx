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
import type { Route } from "./+types/eps-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert EPS Online — Free, Private, No Upload | NoUploads",
		description:
			"Extract the embedded preview from EPS files and convert to JPG, PNG, or WebP in your browser. No upload, no server.",
		path: "/image/eps-converter",
		keywords:
			"eps to jpg, eps to png, eps converter online, open eps file, encapsulated postscript converter",
		jsonLdName: "EPS Converter",
	});
}

const ACCEPT = { "application/postscript": [".eps", ".ps"] };

const faqItems = [
	{
		question: "How did PostScript and EPS shape the publishing industry?",
		answer: (
			<>
				EPS (Encapsulated PostScript) is based on the PostScript page
				description language, created by Adobe co-founders John Warnock and
				Charles Geschke in 1982. PostScript was the technology that launched the
				desktop publishing revolution — it was the language that enabled the
				Apple LaserWriter to produce typeset-quality printed output from a
				personal computer for the first time in history.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Encapsulated_PostScript"
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
		question: "How does this tool extract a preview from EPS files?",
		answer:
			"Most EPS files contain an embedded preview image — typically a TIFF bitmap stored in a DOS EPS binary wrapper, or a hex-encoded bitmap in an EPSI header section. This tool reads the binary structure, locates the preview data, and decodes it into a standard image you can save as JPG, PNG, or WebP. It does not render the PostScript vector data itself, since that requires a full PostScript interpreter.",
	},
	{
		question: "What can't this tool extract from EPS files?",
		answer:
			"The extracted preview is only as detailed as what the original application embedded — often a low-to-medium resolution bitmap, not the full vector quality. EPS files without any embedded preview cannot be converted in a browser. WMF-format previews are not currently supported. For full-resolution vector rendering, use desktop software like Inkscape, Adobe Illustrator, or Ghostscript.",
	},
	{
		question: "Can this tool open .ps (PostScript) files too?",
		answer:
			"The tool accepts .ps files but can only extract embedded preview images, not render arbitrary PostScript programs. Standalone .ps files rarely contain preview sections, so most will show an error. EPS files are far more likely to include usable preview data since embedding previews is part of the EPS specification.",
	},
];

export default function EpsConverterPage() {
	return (
		<ToolPageLayout
			title="Convert EPS"
			description="Extract the embedded preview image from EPS files and convert to JPG, PNG, or WebP — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Extracts the embedded preview image from EPS (Encapsulated PostScript)
					files. Most EPS files contain a TIFF or bitmap preview that was stored
					when the file was created — this tool reads that preview and lets you
					save it as JPG, PNG, WebP, or AVIF. Useful for quickly viewing EPS
					artwork without installing Illustrator or Inkscape. Full PostScript
					rendering is not available in the browser, so the output reflects the
					embedded preview quality, not the full vector resolution. All
					processing happens locally on your device.
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

			<LibraryAttribution packages={["utif2"]} />
		</ToolPageLayout>
	);
}
