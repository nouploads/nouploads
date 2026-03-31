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
import type { Route } from "./+types/exr-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert EXR Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert OpenEXR files to JPG, PNG, or WebP in your browser. Tone-maps HDR data to viewable images with no server upload.",
		path: "/image/exr-converter",
		keywords:
			"exr to jpg, exr converter, openexr converter, open exr file online, exr to png, exr viewer, convert exr to image",
		jsonLdName: "EXR Converter",
		faq: [
			{
				question: "How did OpenEXR end up as the VFX industry standard?",
				answer:
					"OpenEXR was created by Industrial Light & Magic (ILM) and first used in production on Harry Potter and the Sorcerer's Stone in 2001. It was open-sourced in 2003 and has since become the industry-standard high dynamic range image format for visual effects, animation, and film production, supporting 16-bit and 32-bit floating-point pixels per channel.",
			},
			{
				question: "How does tone mapping work for EXR conversion?",
				answer:
					"EXR images contain far more brightness levels than a monitor can display. Tone mapping compresses that range into the 0\u2013255 values standard displays use. This tool applies the Reinhard operator \u2014 a widely used algorithm that preserves relative brightness differences while preventing blown-out highlights. Very bright areas compress smoothly rather than clipping to white.",
			},
			{
				question: "Which EXR variants does this tool support?",
				answer:
					"This tool decodes scanline-based EXR files with uncompressed, ZIPS, or ZIP compression \u2014 the three most common variants exported by Blender, Nuke, and most 3D renderers. It handles half-float (16-bit), full-float (32-bit), and unsigned integer channels. Tiled EXR and less common compressions like PIZ or B44 are not currently supported.",
			},
			{
				question: "Why are EXR files used in VFX and 3D rendering?",
				answer:
					"Visual effects artists need HDR data to composite CG elements into live-action plates with realistic lighting. EXR preserves the mathematical relationship between light intensities that JPEG and PNG destroy. A 32-bit float channel in EXR can represent values from near-zero to thousands, giving compositors the dynamic range they need for color grading, light wrapping, and exposure adjustments.",
			},
		],
	});
}

const ACCEPT = { "image/x-exr": [".exr"] };

const faqItems = [
	{
		question: "How did OpenEXR end up as the VFX industry standard?",
		answer: (
			<>
				OpenEXR was created by Industrial Light & Magic (ILM) and first used in
				production on Harry Potter and the Sorcerer's Stone in 2001. It was
				open-sourced in 2003 and has since become the industry-standard high
				dynamic range image format for visual effects, animation, and film
				production, supporting 16-bit and 32-bit floating-point pixels per
				channel. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/OpenEXR"
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
		question: "How does tone mapping work for EXR conversion?",
		answer:
			"EXR images contain far more brightness levels than a monitor can display. Tone mapping compresses that range into the 0–255 values standard displays use. This tool applies the Reinhard operator — a widely used algorithm that preserves relative brightness differences while preventing blown-out highlights. Very bright areas compress smoothly rather than clipping to white.",
	},
	{
		question: "Which EXR variants does this tool support?",
		answer:
			"This tool decodes scanline-based EXR files with uncompressed, ZIPS, or ZIP compression — the three most common variants exported by Blender, Nuke, and most 3D renderers. It handles half-float (16-bit), full-float (32-bit), and unsigned integer channels. Tiled EXR and less common compressions like PIZ or B44 are not currently supported.",
	},
	{
		question: "Why are EXR files used in VFX and 3D rendering?",
		answer:
			"Visual effects artists need HDR data to composite CG elements into live-action plates with realistic lighting. EXR preserves the mathematical relationship between light intensities that JPEG and PNG destroy. A 32-bit float channel in EXR can represent values from near-zero to thousands, giving compositors the dynamic range they need for color grading, light wrapping, and exposure adjustments.",
	},
];

export default function ExrConverterPage() {
	return (
		<ToolPageLayout
			title="Convert EXR"
			description="Convert OpenEXR HDR images to JPG, PNG, or WebP — free, private, no upload required."
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
					Opens OpenEXR files used in visual effects, 3D rendering, and HDR
					photography, then converts them to standard image formats your browser
					can display. Designed for VFX artists, compositors, and 3D modelers
					who need a quick way to preview or share EXR renders without
					installing Nuke, Photoshop, or a dedicated EXR viewer. Processes
					everything client-side with a custom parser and Reinhard tone mapping
					— your renders stay on your machine, never uploaded to any server.
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
