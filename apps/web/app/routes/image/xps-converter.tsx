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
import type { Route } from "./+types/xps-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert XPS Online — Free, Private, No Upload | NoUploads",
		description:
			"Extract images from XPS and OXPS documents and convert to JPG, PNG, or WebP in your browser. No upload, no server.",
		path: "/image/xps-converter",
		keywords:
			"xps to jpg, xps to png, xps converter online, open xps file, oxps converter, microsoft xps viewer",
		jsonLdName: "XPS Converter",
	});
}

const ACCEPT = {
	"application/vnd.ms-xpsdocument": [".xps"],
	"application/oxps": [".oxps"],
};

const faqItems = [
	{
		question: "What is an XPS file?",
		answer:
			"XPS (XML Paper Specification) is a fixed-layout document format created by Microsoft as an alternative to PDF. It was built into Windows Vista through Windows 10 as the default print-to-file format. OXPS is the newer Open XPS variant standardized by Ecma International. Both use a ZIP archive containing XAML pages, fonts, and embedded images.",
	},
	{
		question: "How does this tool convert XPS files without a server?",
		answer:
			"XPS files are ZIP archives under the hood. This tool opens the archive in your browser using JSZip, scans for embedded raster images (PNG, JPG, TIFF), and extracts the largest one. The extracted image is then available for download as JPG, PNG, WebP, or AVIF. All processing happens locally on your device — the file never leaves your browser.",
	},
	{
		question: "What are the limitations of XPS image extraction?",
		answer:
			"This tool extracts embedded raster images, not the full page layout. Text, vector graphics, and page positioning are not rendered — that would require a complete XAML rendering engine. XPS files that contain only vector content or text without any embedded images cannot be converted. For full XPS rendering, use the built-in XPS Viewer on Windows or a desktop application like Okular.",
	},
	{
		question: "Why use NoUploads instead of other XPS converters?",
		answer:
			"XPS documents often contain sensitive business or personal content that should not be uploaded to third-party servers. NoUploads opens the ZIP archive and extracts images entirely on your device — nothing leaves your browser. There are no file size limits, no daily caps, no watermarks, and no account required. The tool works offline after the first page load and is fully open source.",
	},
];

export default function XpsConverterPage() {
	return (
		<ToolPageLayout
			title="Convert XPS"
			description="Extract embedded images from XPS and OXPS documents and convert to JPG, PNG, or WebP — free, private, no upload required."
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
					Extracts embedded images from XPS and OXPS documents — Microsoft's
					fixed-layout document format. The decoder opens the ZIP archive,
					locates all raster images stored in the document's resource
					directories, and extracts the largest one for conversion to JPG, PNG,
					WebP, or AVIF. Useful for pulling images out of XPS print files
					without installing Windows XPS Viewer or other desktop software. Full
					page layout rendering is not available — only embedded raster images
					are extracted. All processing runs in your browser using JSZip.
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

			<LibraryAttribution packages={["jszip"]} />
		</ToolPageLayout>
	);
}
