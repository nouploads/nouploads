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
import type { Route } from "./+types/gif-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert GIF to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert GIF images to JPG format. Extracts the first frame from animated GIFs. Free and private.",
		path: "/image/gif-to-jpg",
		keywords:
			"gif to jpg, gif to jpeg, convert gif to jpg, gif frame extract, gif to image, gif converter",
		jsonLdName: "GIF to JPG Converter",
	});
}

const ACCEPT = { "image/gif": [".gif"] };

const faqItems = [
	{
		question: "What happens to animated GIFs?",
		answer:
			"The converter renders the first frame of an animated GIF into a static JPG image. Animation data is discarded since JPG only supports single still images. This is useful when you want a thumbnail or preview frame from an animated GIF.",
	},
	{
		question: "Why convert GIF to JPG?",
		answer:
			"GIF files — even static ones — are often much larger than necessary because GIF uses an older compression algorithm. Converting to JPG typically shrinks the file substantially, especially for photographic content. JPG is also more widely accepted for uploads and email attachments.",
	},
	{
		question: "Will transparent areas be preserved?",
		answer:
			"No. GIF supports basic transparency (fully transparent or fully opaque pixels), but JPG doesn't support any transparency. Transparent areas become white in the JPG output. If you need transparency, convert to PNG instead.",
	},
	{
		question: "Can I batch convert multiple GIFs?",
		answer:
			"Yes. Drop several GIF files at once to convert them all to JPG. Each file's first frame is extracted and saved as a separate JPG download.",
	},
	{
		question: "Why use NoUploads instead of other GIF converters?",
		answer:
			"GIFs often come from messaging apps, social media, or memes — content you might not want uploaded to a random conversion website. NoUploads processes everything in your browser so the files stay on your device. It's free, instant, requires no account, and works even offline.",
	},
];

export default function GifToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert GIF to JPG"
			description="Convert GIF images to compact JPG format — free, private, no upload required."
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
					Extracts the first frame from GIF files and saves it as a JPG image.
					Handy for creating static thumbnails from animated GIFs or converting
					old GIF graphics to a more efficient format. Works with both static
					and animated GIF files, processing everything client-side in your
					browser.
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
				Processed using the browser's built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					Canvas API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
