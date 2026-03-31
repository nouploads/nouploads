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
import type { Route } from "./+types/strip-metadata";

const StripMetadataTool = lazy(
	() => import("~/features/image-tools/components/strip-metadata-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Remove EXIF Data Online — Free, Private, No Upload | NoUploads",
		description:
			"Strip GPS location, camera info, and all metadata from JPEG, PNG, and WebP images. Free, private, processes in your browser.",
		path: "/image/strip-metadata",
		keywords:
			"remove exif data, strip metadata, remove gps from photo, exif remover online, photo metadata remover, strip image metadata, privacy photo tool",
		jsonLdName: "EXIF Metadata Remover",
		faq: [
			{
				question:
					"What is the history behind the EXIF standard embedded in photos?",
				answer:
					"EXIF (Exchangeable Image File Format) was developed by the Japan Electronic Industries Development Association (JEIDA) in 1995 to standardize how digital cameras store shooting information alongside image data. The standard was formally published as JEIDA T81-1998 and defines over 450 distinct tag types, including GPS coordinates, camera settings, timestamps, and thumbnail previews. Today it is maintained by JEITA (formerly JEIDA) and CIPA.",
			},
			{
				question: "How does Canvas re-encoding remove metadata from an image?",
				answer:
					"When an image is drawn onto an HTML Canvas element and then re-exported as a new file, only the raw pixel data is transferred. The Canvas API has no mechanism to carry over embedded EXIF, XMP, IPTC, ICC profiles, or GPS coordinates — those metadata segments simply do not exist in the re-encoded output. The result is a visually identical image with zero embedded metadata.",
			},
			{
				question:
					"Which specific metadata fields does this tool strip from photos?",
				answer:
					"This tool removes all embedded metadata segments: EXIF tags (camera make/model, shutter speed, aperture, ISO), GPS coordinates and altitude, XMP sidecar data, IPTC captions and keywords, ICC color profiles, JFIF headers, and any custom manufacturer tags. After processing, the output file contains only pixel data and the minimum file format headers required by JPEG, PNG, or WebP.",
			},
		],
	});
}

const faqItems = [
	{
		question:
			"What is the history behind the EXIF standard embedded in photos?",
		answer: (
			<>
				EXIF (Exchangeable Image File Format) was developed by the Japan
				Electronic Industries Development Association (JEIDA) in 1995 to
				standardize how digital cameras store shooting information alongside
				image data. The standard was formally published as JEIDA T81-1998 and
				defines over 450 distinct tag types, including GPS coordinates, camera
				settings, timestamps, and thumbnail previews. Today it is maintained by
				JEITA (formerly JEIDA) and CIPA. Source:{" "}
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
		question: "How does Canvas re-encoding remove metadata from an image?",
		answer:
			"When an image is drawn onto an HTML Canvas element and then re-exported as a new file, only the raw pixel data is transferred. The Canvas API has no mechanism to carry over embedded EXIF, XMP, IPTC, ICC profiles, or GPS coordinates — those metadata segments simply do not exist in the re-encoded output. The result is a visually identical image with zero embedded metadata.",
	},
	{
		question:
			"Which specific metadata fields does this tool strip from photos?",
		answer:
			"This tool removes all embedded metadata segments: EXIF tags (camera make/model, shutter speed, aperture, ISO), GPS coordinates and altitude, XMP sidecar data, IPTC captions and keywords, ICC color profiles, JFIF headers, and any custom manufacturer tags. After processing, the output file contains only pixel data and the minimum file format headers required by JPEG, PNG, or WebP.",
	},
];

export default function StripMetadataPage() {
	return (
		<ToolPageLayout
			title="EXIF Metadata Remover"
			description="Strip GPS location, camera info, and all metadata from images — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<StripMetadataTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					NoUploads EXIF Metadata Remover strips all embedded metadata from your
					photos before you share them online. Every digital photo carries
					invisible data — GPS coordinates that reveal where you were, camera
					serial numbers, timestamps, and editing software details. This tool is
					built for anyone who values photo privacy: journalists protecting
					sources, activists avoiding location tracking, or anyone sharing
					images on social media. Drop one image or a batch of dozens — each is
					re-encoded through Canvas to produce a clean file with zero embedded
					metadata, then available as individual downloads or a single ZIP
					archive. Everything runs in your browser; your photos never leave your
					device.
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
				· MIT License · Re-encoding via the browser's built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Canvas API
				</a>
			</p>
		</ToolPageLayout>
	);
}
