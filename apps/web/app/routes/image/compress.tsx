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
import type { Route } from "./+types/compress";

const ImageCompressorTool = lazy(
	() => import("~/features/image-tools/components/image-compressor-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Compress JPG, PNG, WebP, and GIF images online for free. Adjust quality, see before and after. Files never leave your device.",
		path: "/image/compress",
		keywords:
			"compress image, reduce image size, image compressor online, free image compressor, compress jpg png webp gif, private image compression, batch compress images",
		jsonLdName: "Image Compressor",
		faq: [
			{
				question: "How does lossy compression exploit human vision?",
				answer:
					"Lossy image compression works by exploiting limitations of the human visual system. Our eyes are far more sensitive to changes in brightness than to changes in color — a principle called chroma subsampling. JPEG, WebP, and AVIF all take advantage of this by storing color information at lower resolution than brightness, often at half or even quarter the resolution, without most viewers noticing any difference.",
			},
			{
				question: "Which image formats can I compress?",
				answer:
					"You can compress JPG, PNG, WebP, AVIF, and GIF images. Static formats are re-encoded at the quality level you choose, while animated GIFs are compressed using lossy LZW optimization via gifsicle — keeping the same file type while reducing size.",
			},
			{
				question: "How does the quality slider work?",
				answer:
					"The slider controls the compression level from 10% (maximum compression, smallest file, most artifacts) to 100% (minimal compression, largest file, best quality). For most uses, 70–85% gives a good balance between size and visual quality.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How does lossy compression exploit human vision?",
		answer: (
			<>
				Lossy image compression works by exploiting limitations of the human
				visual system. Our eyes are far more sensitive to changes in brightness
				than to changes in color — a principle called chroma subsampling. JPEG,
				WebP, and AVIF all take advantage of this by storing color information
				at lower resolution than brightness, often at half or even quarter the
				resolution, without most viewers noticing any difference. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Chroma_subsampling"
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
		question: "Which image formats can I compress?",
		answer:
			"You can compress JPG, PNG, WebP, AVIF, and GIF images. Static formats are re-encoded at the quality level you choose, while animated GIFs are compressed using lossy LZW optimization via gifsicle — keeping the same file type while reducing size.",
	},
	{
		question: "How does the quality slider work?",
		answer:
			"The slider controls the compression level from 10% (maximum compression, smallest file, most artifacts) to 100% (minimal compression, largest file, best quality). For most uses, 70–85% gives a good balance between size and visual quality.",
	},
];

export default function CompressPage() {
	return (
		<ToolPageLayout
			title="Compress Images"
			description="Compress JPG, PNG, WebP, and GIF images online — reduce file size with adjustable quality, free and private."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageCompressorTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Image Compressor reduces file sizes for JPG, PNG, WebP,
					AVIF, and animated GIF images. Static formats use your browser's
					Canvas API, while GIFs are compressed with gifsicle's lossy LZW
					optimization via WebAssembly. Drag and drop any supported image,
					adjust the quality slider, and compare the before and after side by
					side. Handles single files and large batches with no file size
					restrictions or account required.
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
