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
import type { Route } from "./+types/hdr-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert HDR Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert Radiance HDR files to JPG, PNG, or WebP in your browser. Tone-mapped preview, no upload, no signup.",
		path: "/image/hdr-converter",
		keywords:
			"hdr to jpg, hdr converter, radiance hdr, open hdr file, hdr to png online",
		jsonLdName: "HDR Converter",
		faq: [
			{
				question: "Where does the Radiance HDR format come from?",
				answer:
					"The Radiance HDR format (.hdr) was created by Greg Ward for the Radiance lighting simulation system at Lawrence Berkeley National Laboratory in the late 1980s. It was one of the first image formats designed to store actual physical light values (radiance) rather than display-ready pixel colors, making it foundational to the entire field of high dynamic range imaging.",
			},
			{
				question: "How does tone mapping work in this converter?",
				answer:
					"HDR files contain brightness values that exceed what a monitor can display. This tool uses the Reinhard tone mapping operator to compress the full dynamic range into the 0\u2013255 range that standard image formats support. Bright highlights are smoothly rolled off rather than clipped, preserving detail across the entire image.",
			},
			{
				question: "Can I use this for HDRI environment maps?",
				answer:
					"Yes. HDRI environment maps used in Blender, Cinema 4D, Unreal Engine, and other 3D software are typically stored as .hdr files. This converter lets you quickly preview or convert them to JPG or PNG for reference sheets, thumbnails, or sharing with team members who don't have 3D software installed.",
			},
			{
				question: "What is the difference between HDR and EXR?",
				answer:
					"Both store high dynamic range data, but they use different formats. Radiance HDR (.hdr) uses RGBE encoding with 32 bits per pixel and is compact but limited to one layer. OpenEXR (.exr) supports multiple channels, layers, deep data, and higher precision. For simple environment maps and light probes, HDR is more common; for VFX render passes, EXR is the industry standard.",
			},
		],
	});
}

const ACCEPT = { "image/vnd.radiance": [".hdr"] };

const faqItems = [
	{
		question: "Where does the Radiance HDR format come from?",
		answer: (
			<>
				The Radiance HDR format (.hdr) was created by Greg Ward for the Radiance
				lighting simulation system at Lawrence Berkeley National Laboratory in
				the late 1980s. It was one of the first image formats designed to store
				actual physical light values (radiance) rather than display-ready pixel
				colors, making it foundational to the entire field of high dynamic range
				imaging.{" "}
				<a
					href="https://en.wikipedia.org/wiki/RGBE_image_format"
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
		question: "How does tone mapping work in this converter?",
		answer:
			"HDR files contain brightness values that exceed what a monitor can display. This tool uses the Reinhard tone mapping operator to compress the full dynamic range into the 0–255 range that standard image formats support. Bright highlights are smoothly rolled off rather than clipped, preserving detail across the entire image.",
	},
	{
		question: "Can I use this for HDRI environment maps?",
		answer:
			"Yes. HDRI environment maps used in Blender, Cinema 4D, Unreal Engine, and other 3D software are typically stored as .hdr files. This converter lets you quickly preview or convert them to JPG or PNG for reference sheets, thumbnails, or sharing with team members who don't have 3D software installed.",
	},
	{
		question: "What is the difference between HDR and EXR?",
		answer:
			"Both store high dynamic range data, but they use different formats. Radiance HDR (.hdr) uses RGBE encoding with 32 bits per pixel and is compact but limited to one layer. OpenEXR (.exr) supports multiple channels, layers, deep data, and higher precision. For simple environment maps and light probes, HDR is more common; for VFX render passes, EXR is the industry standard.",
	},
];

export default function HdrConverterPage() {
	return (
		<ToolPageLayout
			title="Convert HDR"
			description="Convert Radiance HDR files to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Reads Radiance RGBE (.hdr) files used for environment lighting, light
					probes, and HDR photography, then tone-maps the high dynamic range
					data to standard 8-bit RGB using the Reinhard operator. Designed for
					VFX artists, 3D generalists, and lighting designers who need to
					quickly preview or share HDR assets without specialized software. The
					entire decoding and tone mapping process runs locally in your browser
					with a custom parser — nothing is uploaded, no external libraries are
					loaded.
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
