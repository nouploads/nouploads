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
import type { Route } from "./+types/dds-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert DDS Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert DirectDraw Surface DDS textures to JPG, PNG, or WebP in your browser. Supports DXT1, DXT3, DXT5, and uncompressed formats.",
		path: "/image/dds-converter",
		keywords:
			"dds to jpg, dds converter, dds to png, convert dds texture, open dds file",
		jsonLdName: "DDS Converter",
	});
}

const ACCEPT = { "image/vnd-ms.dds": [".dds"] };

const faqItems = [
	{
		question: "Where does the DDS texture format come from?",
		answer: (
			<>
				DirectDraw Surface (DDS) was introduced by Microsoft as part of DirectX
				7 in 1999. It stores textures in GPU-native compressed formats (like
				DXT/BCn) that can be uploaded directly to graphics hardware without any
				decompression step — making it the preferred format for video games and
				real-time 3D applications where texture loading speed is critical.{" "}
				<a
					href="https://en.wikipedia.org/wiki/DirectDraw_Surface"
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
		question: "What are DXT1, DXT3, and DXT5 compression?",
		answer:
			"DXT1 (BC1), DXT3 (BC2), and DXT5 (BC3) are S3TC block compression schemes that encode 4x4 pixel blocks into compact representations. DXT1 stores two reference colors and a 2-bit index per pixel — great for opaque textures or those with simple 1-bit transparency. DXT3 adds explicit 4-bit alpha values per pixel for sharp alpha transitions. DXT5 uses interpolated alpha with two reference values and 3-bit indices, producing smoother gradients for soft edges and particle effects.",
	},
	{
		question: "Can this tool open DDS cubemaps and mipmapped textures?",
		answer:
			"This converter reads the first face (mip level 0) of any DDS file, including cubemaps and textures with mipmap chains. Cubemaps store six faces for environment mapping — the tool extracts the positive-X face at full resolution. Mipmapped textures contain pre-scaled copies for level-of-detail rendering; the tool decodes only the largest mip level so you get the full-resolution image.",
	},
	{
		question: "Why would I need to convert a DDS file?",
		answer:
			"Game developers and 3D artists frequently work with DDS textures in tools like Unreal Engine, Unity, Blender, and Substance Painter. When you need to share a texture preview with a colleague, embed it in documentation, or post it online, converting to JPG or PNG gives you a universally viewable image. This tool lets you inspect and convert DDS assets without installing dedicated texture viewers.",
	},
];

export default function DdsConverterPage() {
	return (
		<ToolPageLayout
			title="Convert DDS"
			description="Convert DirectDraw Surface textures to JPG, PNG, or WebP — free, private, no upload required."
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
					Decodes DirectDraw Surface (DDS) texture files used throughout game
					development and 3D rendering pipelines. Supports S3TC block
					compression formats DXT1, DXT3, and DXT5 as well as uncompressed
					32-bit RGBA textures. Ideal for game developers, texture artists, and
					modders who need to preview or share DDS assets without specialized
					tools. Decompression runs entirely in your browser with a built-in
					parser — no server, no external library.
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
