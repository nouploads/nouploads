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
import type { Route } from "./+types/png-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PNG to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PNG images to JPG for smaller file sizes. Free, private, no server upload required.",
		path: "/image/png-to-jpg",
		keywords:
			"png to jpg, png to jpeg, convert png to jpg online, png to jpg converter, reduce png file size",
		jsonLdName: "PNG to JPG Converter",
	});
}

const ACCEPT = { "image/png": [".png"] };

const faqItems = [
	{
		question: "How did JPEG become the universal photo format?",
		answer: (
			<>
				JPEG was created in 1992 by the Joint Photographic Experts Group, a
				collaboration between ISO and the ITU. Its lossy compression algorithm
				was revolutionary — it made digital photography practical by shrinking
				photo files to a fraction of their original size while keeping quality
				visually acceptable to the human eye. More than three decades later,
				JPEG remains the most widely used image format in the world.{" "}
				<a
					href="https://en.wikipedia.org/wiki/JPEG"
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
		question: "What happens to transparent areas?",
		answer:
			"JPG doesn't support transparency. Any transparent areas in your PNG will be filled with a white background during conversion. If you need to preserve transparency, consider WebP or keep the PNG format.",
	},
	{
		question: "How much smaller will my files be?",
		answer:
			"It depends on the image content. Photographs converted from PNG to JPG typically shrink by 50–90%. Simple graphics with flat colors see less dramatic savings because JPG compression is optimized for continuous-tone images.",
	},
];

export default function PngToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert PNG to JPG"
			description="Convert PNG images to compact JPG format — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/jpeg" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Re-encodes PNG images as JPG through the browser's Canvas API,
					compositing any transparent regions onto a white background before
					JPEG compression. Photographs saved as PNG typically shrink by 50--90%
					after conversion because JPG's lossy DCT compression is far more
					efficient for continuous-tone imagery than PNG's lossless deflate. The
					quality slider lets you balance sharpness against file size — 85% is a
					good starting point for screenshots destined for Slack or email.
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
