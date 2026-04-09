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
import type { Route } from "./+types/psb-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PSB Online — Free, Instant | NoUploads",
		description:
			"Convert Photoshop Large Document PSB files to JPG, PNG, WebP, or AVIF in your browser. Handles oversized canvases beyond PSD limits. No upload, no signup.",
		path: "/image/psb-converter",
		keywords:
			"psb to jpg, psb converter, photoshop large document converter, open psb file, psb to png, convert psb online free",
		jsonLdName: "PSB Converter",
		faq: [
			{
				question: "Why did Adobe need a format bigger than PSD?",
				answer:
					"PSB (Photoshop Big) was introduced with Adobe Photoshop CS in 2003 to handle documents that exceed PSD's limits of 30,000 x 30,000 pixels and 2 GB file size. PSB supports canvases up to 300,000 x 300,000 pixels — essential for billboard-scale designs, gigapixel panoramas, and large-format print work where a single image file can easily reach tens of gigabytes.",
			},
			{
				question: "How is PSB different from PSD?",
				answer:
					"PSD and PSB share the same internal structure — layers, masks, adjustment layers, color profiles — but PSB uses 8-byte (64-bit) length fields instead of PSD's 4-byte fields, allowing it to store much larger images. If Photoshop tells you a file is too big for PSD, it saves as PSB instead. This converter handles both transparently.",
			},
			{
				question: "Is there a dimension limit for browser-based conversion?",
				answer:
					"PSB files can theoretically hold 300,000 x 300,000 pixel images, but browsers cannot allocate that much memory. This tool limits conversion to images up to 8,192 x 8,192 pixels to prevent crashing your browser tab. Larger PSB files will show a clear error message rather than silently failing.",
			},
			{
				question: "Does it support CMYK PSB files?",
				answer:
					"Yes. CMYK color data in PSB files is automatically converted to RGB during compositing. The output works correctly in web browsers, email clients, and standard image viewers without any manual color profile adjustment.",
			},
		],
	});
}

const ACCEPT = { "image/vnd.adobe.photoshop-large": [".psb"] };

const faqItems = [
	{
		question: "Why did Adobe need a format bigger than PSD?",
		answer: (
			<>
				PSB (Photoshop Big) was introduced with Adobe Photoshop CS in 2003 to
				handle documents that exceed PSD's limits of 30,000 × 30,000 pixels and
				2 GB file size. PSB supports canvases up to 300,000 × 300,000 pixels —
				essential for billboard-scale designs, gigapixel panoramas, and
				large-format print work where a single image file can easily reach tens
				of gigabytes. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Adobe_Photoshop#File_format"
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
		question: "How is PSB different from PSD?",
		answer:
			"PSD and PSB share the same internal structure — layers, masks, adjustment layers, color profiles — but PSB uses 8-byte (64-bit) length fields instead of PSD's 4-byte fields, allowing it to store much larger images. If Photoshop tells you a file is too big for PSD, it saves as PSB instead. This converter handles both transparently.",
	},
	{
		question: "Is there a dimension limit for browser-based conversion?",
		answer:
			"PSB files can theoretically hold 300,000 x 300,000 pixel images, but browsers cannot allocate that much memory. This tool limits conversion to images up to 8,192 x 8,192 pixels to prevent crashing your browser tab. Larger PSB files will show a clear error message rather than silently failing.",
	},
	{
		question: "Does it support CMYK PSB files?",
		answer:
			"Yes. CMYK color data in PSB files is automatically converted to RGB during compositing. The output works correctly in web browsers, email clients, and standard image viewers without any manual color profile adjustment.",
	},
];

export default function PsbConverterPage() {
	return (
		<ToolPageLayout
			title="Convert PSB"
			description="Convert Photoshop Large Document PSB files to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Opens Adobe Photoshop Large Document (PSB) files and composites all
					visible layers into a single flattened image you can export as JPG,
					PNG, WebP, or AVIF. PSB is the big sibling of PSD, used when images
					exceed 30,000 pixels on a side or 2 GB in size. Useful for print
					designers, panoramic photographers, and VFX artists who need to share
					or preview oversized Photoshop documents without installing Photoshop.
					All decoding runs locally in your browser — your files never leave
					your device.
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

			<LibraryAttribution packages={["@webtoon/psd"]} />
		</ToolPageLayout>
	);
}
