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
import type { Route } from "./+types/pcx-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PCX Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert ZSoft PCX images to JPG, PNG, or WebP in your browser. Handles 256-color, 24-bit RGB, and monochrome PCX files.",
		path: "/image/pcx-converter",
		keywords:
			"pcx to jpg, pcx converter, pcx to png, convert pcx online, open pcx file, pcx viewer, zsoft pcx",
		jsonLdName: "PCX Converter",
		faq: [
			{
				question: "How did PCX become the first mainstream PC image format?",
				answer:
					"PCX was one of the first widely used image formats on IBM-compatible PCs, created by ZSoft Corporation for their PC Paintbrush program in 1985. Before Windows made BMP the default, PCX was the standard format for DOS-based graphics applications. It used simple run-length encoding for compression and supported up to 16 million colors in its later versions.",
			},
			{
				question: "How does PCX compression work?",
				answer:
					"PCX uses run-length encoding, a straightforward lossless compression scheme. When consecutive pixels share the same value, the encoder stores a count byte (with the two high bits set) followed by the pixel value, instead of repeating the value multiple times. Single unique bytes below 0xC0 are stored as-is. This keeps the format simple to parse while still reducing file size for images with solid-color regions.",
			},
			{
				question: "What color modes does this converter support?",
				answer:
					"This tool decodes all standard PCX color modes: 24-bit RGB (3 planes at 8 bits each) for full-color photographs, 256-color indexed images that use a VGA palette stored at the end of the file, and 1-bit monochrome for line art and scanned documents. The built-in RLE decompressor handles both compressed and uncompressed variants.",
			},
		],
	});
}

const ACCEPT = { "image/x-pcx": [".pcx"] };

const faqItems = [
	{
		question: "How did PCX become the first mainstream PC image format?",
		answer: (
			<>
				PCX was one of the first widely used image formats on IBM-compatible
				PCs, created by ZSoft Corporation for their PC Paintbrush program in
				1985. Before Windows made BMP the default, PCX was the standard format
				for DOS-based graphics applications. It used simple run-length encoding
				for compression and supported up to 16 million colors in its later
				versions.{" "}
				<a
					href="https://en.wikipedia.org/wiki/PCX"
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
		question: "How does PCX compression work?",
		answer:
			"PCX uses run-length encoding, a straightforward lossless compression scheme. When consecutive pixels share the same value, the encoder stores a count byte (with the two high bits set) followed by the pixel value, instead of repeating the value multiple times. Single unique bytes below 0xC0 are stored as-is. This keeps the format simple to parse while still reducing file size for images with solid-color regions.",
	},
	{
		question: "What color modes does this converter support?",
		answer:
			"This tool decodes all standard PCX color modes: 24-bit RGB (3 planes at 8 bits each) for full-color photographs, 256-color indexed images that use a VGA palette stored at the end of the file, and 1-bit monochrome for line art and scanned documents. The built-in RLE decompressor handles both compressed and uncompressed variants.",
	},
];

export default function PcxConverterPage() {
	return (
		<ToolPageLayout
			title="Convert PCX"
			description="Convert ZSoft PCX images to JPG, PNG, or WebP — free, private, no upload required."
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
					Decodes ZSoft PCX bitmap images, an early PC graphics format that
					still surfaces in retro game assets, legacy archives, and older
					technical software. Supports 256-color indexed images with VGA palette
					lookup, 24-bit true-color RGB stored as separate color planes, and
					1-bit monochrome for scanned line art. RLE decompression and pixel
					assembly run entirely in your browser using a built-in parser — no
					external library or server involved.
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
