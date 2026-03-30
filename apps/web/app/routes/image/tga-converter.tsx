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
import type { Route } from "./+types/tga-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert TGA Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert Targa TGA files to JPG, PNG, or WebP in your browser. Handles RLE compression and all color depths.",
		path: "/image/tga-converter",
		keywords:
			"tga to jpg, tga converter, targa converter, open tga file, tga to png, convert tga online, tga viewer",
		jsonLdName: "TGA Converter",
	});
}

const ACCEPT = { "image/x-tga": [".tga"] };

const faqItems = [
	{
		question: "What is a TGA file?",
		answer:
			"TGA (Targa) is an image format created by Truevision in 1984. It supports 8, 16, 24, and 32-bit color depths with optional RLE compression and an alpha channel. TGA remains widely used in game development, 3D rendering, and texture authoring because it stores pixel data with minimal processing — exactly what GPU pipelines expect.",
	},
	{
		question: "Why is TGA still used in game development?",
		answer:
			"Game engines and 3D tools like Unreal Engine, Unity, and Blender use TGA because it preserves exact pixel values without lossy compression artifacts. Texture artists need predictable colors for normal maps, specular maps, and diffuse textures. TGA's simple structure also makes it fast to read and write during asset pipelines.",
	},
	{
		question: "Does this handle RLE-compressed TGA files?",
		answer:
			"Yes. The decoder handles both uncompressed and RLE-compressed TGA images, including true-color, grayscale, and color-mapped variants. RLE (run-length encoding) is a lightweight lossless compression that some TGA exporters use to reduce file size without any quality loss.",
	},
	{
		question: "Why do some TGA files appear upside down?",
		answer:
			"Most TGA files store pixel rows bottom-to-top — a convention inherited from early graphics hardware. Programs that ignore the origin flag in the TGA header display the image flipped. This tool reads the origin bit and automatically flips the image to the correct orientation.",
	},
	{
		question: "Why use NoUploads instead of other TGA converters?",
		answer:
			"Game assets and textures are often proprietary. NoUploads parses the TGA binary format entirely in your browser with a custom decoder — no file is ever sent to a server. It handles every common TGA variant: uncompressed, RLE, 8 to 32 bpp, color-mapped, and bottom-origin images. Free, unlimited, works offline, no account needed.",
	},
];

export default function TgaConverterPage() {
	return (
		<ToolPageLayout
			title="Convert TGA"
			description="Convert Targa TGA images to JPG, PNG, or WebP — free, private, no upload required."
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
					Decodes Targa (TGA) image files commonly used for game textures, 3D
					rendering assets, and legacy graphics workflows. Handles all standard
					TGA variants including uncompressed and RLE-compressed images at 8,
					16, 24, and 32-bit color depths. Automatically corrects the
					bottom-to-top row order that most TGA files use. Processing runs
					entirely in your browser using a built-in parser — no external library
					or server involved.
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
