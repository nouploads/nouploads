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
import type { Route } from "./+types/legacy-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Convert Legacy Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Open and convert SGI, Sun Raster, WBMP, SFW, Photo CD, and PICT files in your browser. No server, no signup.",
		path: "/image/legacy-converter",
		keywords:
			"sgi converter, sun raster converter, wbmp converter, sfw converter, pcd converter, pict converter, legacy image formats, convert old images online",
		jsonLdName: "Legacy Image Converter",
	});
}

const ACCEPT = {
	"image/x-sgi": [".sgi", ".rgb", ".bw"],
	"image/x-sun-raster": [".ras"],
	"image/vnd.wap.wbmp": [".wbmp"],
	"image/x-sfw": [".sfw"],
	"image/x-photo-cd": [".pcd"],
	"image/x-pict": [".pict", ".pct"],
};

const faqItems = [
	{
		question: "What legacy image formats does this tool support?",
		answer:
			"This converter handles six vintage formats that modern software often cannot open: SGI (Silicon Graphics), Sun Raster (.ras), WBMP (Wireless Bitmap), SFW (Seattle Film Works), PCD (Kodak Photo CD), and PICT (Apple QuickDraw). Drop any of these and get a standard JPG, PNG, or WebP you can use anywhere.",
	},
	{
		question: "Where do these legacy image files come from?",
		answer:
			"SGI images originate from Silicon Graphics workstations popular in film and scientific visualization during the 1990s. Sun Raster files come from Sun Microsystems Unix workstations. WBMP was used on early WAP mobile phones. SFW files were mailed to customers by Seattle Film Works photo processing. PCD was Kodak's disc-based photo delivery format. PICT was the native image format on classic Macintosh computers.",
	},
	{
		question: "How does the conversion work without uploading my files?",
		answer:
			"Each format has a dedicated binary parser built in JavaScript that runs directly in your browser. The parser reads the raw byte structure of the file — headers, color tables, compressed scanlines — and reconstructs the pixel data locally. No server ever sees your file. For formats that embed JPEG data (SFW, some PICT files), the browser's native JPEG decoder handles the inner image.",
	},
	{
		question: "Why use NoUploads instead of other legacy image converters?",
		answer:
			"Legacy files often come from personal archives — old family photos, archived project files, retro computing collections. Uploading them to a random server is unnecessary and risky. NoUploads decodes every byte on your device with zero-dependency custom parsers. There is no file size limit, no watermark, no account, and it works fully offline. The source code is open so you can verify exactly what happens to your data.",
	},
];

export default function LegacyConverterPage() {
	return (
		<ToolPageLayout
			title="Convert Legacy Images"
			description="Open and convert SGI, Sun Raster, WBMP, SFW, Photo CD, and PICT files to modern formats — free, private, no upload required."
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
					Converts six obsolete image formats that modern operating systems and
					browsers no longer recognize. Covers SGI files from Silicon Graphics
					workstations, Sun Raster bitmaps from SunOS, WBMP monochrome images
					from early mobile phones, Seattle Film Works photos, Kodak Photo CD
					scans, and Apple PICT drawings. Each format is decoded with a
					purpose-built parser running entirely in your browser — no file leaves
					your device and no external library is loaded.
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

			<LibraryAttribution browserApi="canvas" />
		</ToolPageLayout>
	);
}
