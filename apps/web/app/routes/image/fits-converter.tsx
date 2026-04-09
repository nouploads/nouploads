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
import type { Route } from "./+types/fits-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert FITS Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert FITS astronomy images to JPG, PNG, or WebP in your browser. Auto-stretched preview, no upload, no signup.",
		path: "/image/fits-converter",
		keywords:
			"fits to jpg, fits converter, fits viewer, open fits file, astronomy image converter, fits to png online",
		jsonLdName: "FITS Converter",
		faq: [
			{
				question: "How did FITS become the universal astronomy format?",
				answer:
					"FITS (Flexible Image Transport System) is the standard data format used in astronomy. Developed in the late 1970s and first standardized in 1981, it is endorsed by NASA and the International Astronomical Union. Every image captured by the Hubble Space Telescope, the James Webb Space Telescope, and virtually every ground-based observatory in the world is stored and distributed in FITS format.",
			},
			{
				question:
					"Why do FITS images look black or washed out without stretching?",
				answer:
					"Astronomical images captured by CCD or CMOS sensors often have most of their pixel values concentrated in a narrow range near the background level, with only a few bright pixels from stars or nebulae. Displaying the raw values directly produces an image that looks almost entirely black. Auto-stretching maps the 1st and 99th percentile of the data to the display range, revealing the faint structures that the sensor actually captured.",
			},
			{
				question: "Which FITS data types does this tool support?",
				answer:
					"This converter handles the five standard BITPIX types defined in the FITS specification: 8-bit unsigned integer, 16-bit signed integer, 32-bit signed integer, 32-bit IEEE float, and 64-bit IEEE double. It also applies BSCALE and BZERO header values for physical unit conversion. Both grayscale (NAXIS=2) and color images stored as three separate planes (NAXIS=3, NAXIS3=3) are supported.",
			},
			{
				question:
					"Can I use this for images from Hubble, JWST, or ground telescopes?",
				answer:
					"Yes. FITS files from any telescope or survey — including Hubble, James Webb, Chandra, ALMA, and ground-based observatories — can be converted here as long as they are 2D image data (not data cubes, tables, or multi-extension files with complex structures). Public archive data from MAST, ESO, or IRSA typically works out of the box.",
			},
		],
	});
}

const ACCEPT = { "image/fits": [".fits", ".fts", ".fit"] };

const faqItems = [
	{
		question: "How did FITS become the universal astronomy format?",
		answer: (
			<>
				FITS (Flexible Image Transport System) is the standard data format used
				in astronomy. Developed in the late 1970s and first standardized in
				1981, it is endorsed by NASA and the International Astronomical Union.
				Every image captured by the Hubble Space Telescope, the James Webb Space
				Telescope, and virtually every ground-based observatory in the world is
				stored and distributed in FITS format. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/FITS"
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
		question: "Why do FITS images look black or washed out without stretching?",
		answer:
			"Astronomical images captured by CCD or CMOS sensors often have most of their pixel values concentrated in a narrow range near the background level, with only a few bright pixels from stars or nebulae. Displaying the raw values directly produces an image that looks almost entirely black. Auto-stretching maps the 1st and 99th percentile of the data to the display range, revealing the faint structures that the sensor actually captured.",
	},
	{
		question: "Which FITS data types does this tool support?",
		answer:
			"This converter handles the five standard BITPIX types defined in the FITS specification: 8-bit unsigned integer, 16-bit signed integer, 32-bit signed integer, 32-bit IEEE float, and 64-bit IEEE double. It also applies BSCALE and BZERO header values for physical unit conversion. Both grayscale (NAXIS=2) and color images stored as three separate planes (NAXIS=3, NAXIS3=3) are supported.",
	},
	{
		question:
			"Can I use this for images from Hubble, JWST, or ground telescopes?",
		answer:
			"Yes. FITS files from any telescope or survey — including Hubble, James Webb, Chandra, ALMA, and ground-based observatories — can be converted here as long as they are 2D image data (not data cubes, tables, or multi-extension files with complex structures). Public archive data from MAST, ESO, or IRSA typically works out of the box.",
	},
];

export default function FitsConverterPage() {
	return (
		<ToolPageLayout
			title="Convert FITS"
			description="Convert FITS astronomy images to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Opens FITS files used in astronomy, astrophotography, and scientific
					imaging, then converts them to standard image formats for sharing,
					presentations, or quick inspection. Handles integer and floating-point
					pixel data with automatic percentile-based stretching to bring out
					faint detail that raw values hide. Built for astronomers, researchers,
					and citizen scientists who need to preview or export observation data
					without installing DS9, GIMP with astro plugins, or a full Python
					stack. Everything runs client-side with a custom FITS parser — your
					data never leaves your device.
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
