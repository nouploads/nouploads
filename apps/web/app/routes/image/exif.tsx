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
import type { Route } from "./+types/exif";

const ExifViewerTool = lazy(
	() => import("~/features/image-tools/components/exif-viewer-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"EXIF Viewer Online — View & Strip Photo Metadata, Free & Private | NoUploads",
		description:
			"View and strip EXIF metadata from photos online for free. No upload, no signup — files never leave your device.",
		path: "/image/exif",
		keywords:
			"exif viewer, exif remover, strip exif data, remove photo metadata, photo metadata viewer, private exif stripper, free exif tool",
		jsonLdName: "EXIF Metadata Viewer",
		faq: [
			{
				question: "Where did the EXIF standard come from?",
				answer:
					"EXIF (Exchangeable Image File Format) was developed by the Japan Electronic Industries Development Association (JEIDA) and first published in 1995. It is embedded in virtually every photo taken by a digital camera or smartphone, storing camera model, exposure settings, GPS coordinates, and timestamps. Security researchers frequently advise stripping EXIF data before sharing photos online to avoid inadvertently revealing location information.",
			},
			{
				question: "What types of metadata can this tool read?",
				answer:
					"This viewer reads EXIF, XMP, IPTC, ICC color profile, JFIF, and IHDR metadata segments. It organizes the data into readable groups — camera info, lens details, exposure settings, GPS location, and image properties — so you can quickly find what you need.",
			},
			{
				question: "How does metadata stripping work?",
				answer:
					"The tool redraws your image through an HTML Canvas element, which produces a clean copy without any embedded metadata. The original pixel content is preserved at high quality (95% for JPG), but all EXIF, GPS, XMP, and other metadata is removed. The cleaned file is generated entirely in your browser.",
			},
			{
				question: "Can this tool read metadata from PNG files?",
				answer:
					"Yes. While PNG files don't use EXIF in the traditional sense, they can contain tEXt, iTXt, and other metadata chunks. This tool reads whatever metadata is present in PNG, JPG, WebP, TIFF, HEIC, and AVIF files. If a file has no embedded metadata, the viewer will tell you.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Where did the EXIF standard come from?",
		answer: (
			<>
				EXIF (Exchangeable Image File Format) was developed by the Japan
				Electronic Industries Development Association (JEIDA) and first
				published in 1995. It is embedded in virtually every photo taken by a
				digital camera or smartphone, storing camera model, exposure settings,
				GPS coordinates, and timestamps. Security researchers frequently advise
				stripping EXIF data before sharing photos online to avoid inadvertently
				revealing location information. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Exif"
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
		question: "What types of metadata can this tool read?",
		answer:
			"This viewer reads EXIF, XMP, IPTC, ICC color profile, JFIF, and IHDR metadata segments. It organizes the data into readable groups — camera info, lens details, exposure settings, GPS location, and image properties — so you can quickly find what you need.",
	},
	{
		question: "How does metadata stripping work?",
		answer:
			"The tool redraws your image through an HTML Canvas element, which produces a clean copy without any embedded metadata. The original pixel content is preserved at high quality (95% for JPG), but all EXIF, GPS, XMP, and other metadata is removed. The cleaned file is generated entirely in your browser.",
	},
	{
		question: "Can this tool read metadata from PNG files?",
		answer:
			"Yes. While PNG files don't use EXIF in the traditional sense, they can contain tEXt, iTXt, and other metadata chunks. This tool reads whatever metadata is present in PNG, JPG, WebP, TIFF, HEIC, and AVIF files. If a file has no embedded metadata, the viewer will tell you.",
	},
];

export default function ExifPage() {
	return (
		<ToolPageLayout
			title="EXIF Viewer"
			description="View and strip EXIF metadata from photos — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ExifViewerTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads EXIF Viewer reads and displays all embedded metadata from
					your photos — camera make and model, shutter speed, aperture, ISO, GPS
					coordinates, lens details, color profiles, and more. It supports JPG,
					PNG, WebP, TIFF, HEIC, and AVIF files. If a photo contains location
					data, the viewer flags it with a warning so you can strip the metadata
					before sharing. The stripping process redraws the image through
					Canvas, producing a clean file with zero embedded metadata. Everything
					runs client-side — your photos never leave your device.
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
					href="https://github.com/MikeKovarik/exifr"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					exifr
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
